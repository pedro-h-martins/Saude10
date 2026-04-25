import { getFirestore, collection, doc, setDoc, deleteDoc, getDoc } from '@react-native-firebase/firestore';
import { Realm } from '@realm/react';
import { Platform } from 'react-native';
import { SyncQueue } from '../models/SyncQueue';
import { isOnline } from '../utils/network';

const TIMEOUT_MS = 10000;
const MAX_RETRIES = 3;

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function tryRemoteRead(collection_: string, docId: string, retries = 0): Promise<any | null> {
  if (Platform.OS === 'web') return null;

  try {
    const db = getFirestore();
    const ref = doc(collection(db, collection_), docId);
    const promise = getDoc(ref);
    const timeoutPromise = new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Timeout')), TIMEOUT_MS));
    const snapshot = await Promise.race([promise, timeoutPromise]);
    
    if (snapshot.exists) {
      return snapshot.data();
    }
    return null;
  } catch {
    if (retries < MAX_RETRIES) {
      const backoff = Math.pow(2, retries) * 1000;
      await wait(backoff);
      return tryRemoteRead(collection_, docId, retries + 1);
    }
    return null;
  }
}

export async function tryRemoteWrite(collection_: string, docId: string, data: any, retries = 0): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    const db = getFirestore();
    const ref = doc(collection(db, collection_), docId);
    const promise = setDoc(ref, data, { merge: true });

    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), TIMEOUT_MS));
    await Promise.race([promise, timeoutPromise]);
    return true;
  } catch {
    if (retries < MAX_RETRIES) {
      const backoff = Math.pow(2, retries) * 1000;
      await wait(backoff);
      return tryRemoteWrite(collection_, docId, data, retries + 1);
    }
    return false;
  }
}

export async function tryRemoteDelete(collection_: string, docId: string, retries = 0): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    const db = getFirestore();
    const ref = doc(collection(db, collection_), docId);
    const promise = deleteDoc(ref);
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), TIMEOUT_MS));
    await Promise.race([promise, timeoutPromise]);
    return true;
  } catch {
    if (retries < MAX_RETRIES) {
      const backoff = Math.pow(2, retries) * 1000;
      await wait(backoff);
      return tryRemoteDelete(collection_, docId, retries + 1);
    }
    return false;
  }
}

export async function saveEntity(
  realm: Realm,
  entityType: string,
  entityId: string,
  data: any,
  userId: string | null
): Promise<void> {
  let success = false;

  if (userId) {
    const online = await isOnline();
    if (online) {
      const payload = { ...data };
      if (payload._id) delete payload._id;
      
      success = await tryRemoteWrite(`users/${userId}/${entityType}`, entityId, payload);
    }
  }

  realm.write(() => {
    const existing = realm.objectForPrimaryKey(entityType, new Realm.BSON.ObjectId(entityId));
    if (existing) {
      realm.create(entityType, data, Realm.UpdateMode.Modified);
    } else {
      realm.create(entityType, data);
    }

    if (!success && userId) {
      realm.create(SyncQueue, {
        _id: new Realm.BSON.ObjectId(),
        entityType,
        entityId,
        operation: 'UPDATE',
        payload: JSON.stringify(data),
        createdAt: new Date(),
        retryCount: 0,
      });
      console.warn(`[SyncService] Failed to sync ${entityType}/${entityId} to Firebase. Queued for background sync.`);
    }
  });
}

export async function deleteEntity(
  realm: Realm,
  entityType: string,
  entityId: string,
  userId: string | null
): Promise<void> {
  let success = false;

  if (userId) {
    const online = await isOnline();
    if (online) {
      success = await tryRemoteDelete(`users/${userId}/${entityType}`, entityId);
    }
  }

  realm.write(() => {
    const existing = realm.objectForPrimaryKey(entityType, new Realm.BSON.ObjectId(entityId));
    if (existing) {
      realm.delete(existing);
    }

    if (!success && userId) {
      realm.create(SyncQueue, {
        _id: new Realm.BSON.ObjectId(),
        entityType,
        entityId,
        operation: 'DELETE',
        payload: '{}',
        createdAt: new Date(),
        retryCount: 0,
      });
      console.warn(`[SyncService] Failed to delete ${entityType}/${entityId} from Firebase. Queued for background sync.`);
    }
  });
}

export async function processSyncQueue(realm: Realm, userId: string) {
  const online = await isOnline();
  if (!online || Platform.OS === 'web') return;

  const queue = realm.objects(SyncQueue);
  if (queue.length === 0) return;

  for (const item of queue) {
    try {
      const payload = JSON.parse(item.payload);
      if (payload._id) delete payload._id;

      let success = false;
      if (item.operation === 'DELETE') {
        success = await tryRemoteDelete(`users/${userId}/${item.entityType}`, item.entityId);
      } else {
        success = await tryRemoteWrite(`users/${userId}/${item.entityType}`, item.entityId, payload);
      }
      
      if (success) {
        realm.write(() => {
          realm.delete(item);
        });
      } else {
        realm.write(() => {
          item.retryCount += 1;
        });
      }
    } catch {
      realm.write(() => {
        item.retryCount += 1;
      });
    }
  }
}
