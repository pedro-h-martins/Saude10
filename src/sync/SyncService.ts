import { collection, deleteDoc, doc, getDoc, getFirestore, onSnapshot, setDoc } from '@react-native-firebase/firestore';
import { Realm } from '@realm/react';
import { Platform } from 'react-native';

const TIMEOUT_MS = 10000;
const MAX_RETRIES = 3;
const SYNC_ENTITY_TYPES = [
  'UserProfile',
  'Goal',
  'ActivityLog',
  'BloodPressure',
  'HydrationLog',
  'PomodoroLog',
  'Reminder',
  'SymptomLog',
  'WellnessLog',
  'Workout',
];

let activeListeners: (() => void)[] = [];

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isSyncSupported() {
  return Platform.OS !== 'web';
}

function normalizeFirestoreValue(value: any): any {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value?.toDate === 'function') {
    return value.toDate();
  }

  if (Array.isArray(value)) {
    return value.map(normalizeFirestoreValue);
  }

  if (typeof value === 'object') {
    return normalizeFirestoreData(value);
  }

  return value;
}

function normalizeFirestoreData(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(normalizeFirestoreValue);
  }

  if (typeof data !== 'object') {
    return data;
  }

  return Object.entries(data).reduce((acc, [key, value]) => {
    acc[key] = normalizeFirestoreValue(value);
    return acc;
  }, {} as Record<string, any>);
}

function buildPrimaryKey(entityType: string, entityId: string) {
  return entityType === 'UserProfile' ? entityId : new Realm.BSON.ObjectId(entityId);
}

function applyRemoteDocument(realm: Realm, entityType: string, docId: string, data: any) {
  const normalized = normalizeFirestoreData(data);
  realm.create(entityType, { ...normalized, _id: buildPrimaryKey(entityType, docId) }, Realm.UpdateMode.Modified);
}

function removeRemoteDocument(realm: Realm, entityType: string, docId: string) {
  const primaryKey = buildPrimaryKey(entityType, docId);
  const existing = realm.objectForPrimaryKey(entityType, primaryKey);
  if (existing) {
    realm.delete(existing);
  }
}

function subscribeToCollection(realm: Realm, userId: string, entityType: string) {
  const db = getFirestore();
  const collectionRef = collection(db, `users/${userId}/${entityType}`);

  const unsubscribe = onSnapshot(
    collectionRef,
    (snapshot) => {
      realm.write(() => {
        snapshot.docChanges().forEach((change) => {
          const docId = change.doc.id;
          if (change.type === 'removed') {
            removeRemoteDocument(realm, entityType, docId);
          } else {
            applyRemoteDocument(realm, entityType, docId, change.doc.data());
          }
        });
      });
    },
    (error) => {
      console.warn(`[SyncService] Firestore listener failed for ${entityType}`, error);
    }
  );

  return unsubscribe;
}

export async function tryRemoteRead(collection_: string, docId: string, retries = 0): Promise<any | null> {
  if (!isSyncSupported()) return null;

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
  if (!isSyncSupported()) return false;

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
  if (!isSyncSupported()) return false;

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
  const payload = { ...data };
  if (payload._id) delete payload._id;

  realm.write(() => {
    realm.create(entityType, { ...data, _id: buildPrimaryKey(entityType, entityId) }, Realm.UpdateMode.Modified);
  });

  if (!userId || !isSyncSupported()) {
    return;
  }

  const success = await tryRemoteWrite(`users/${userId}/${entityType}`, entityId, payload);
  if (!success) {
    console.warn(`[SyncService] Remote write failed for ${entityType}/${entityId}. Firestore offline persistence will retry when possible.`);
  }
}

export async function deleteEntity(
  realm: Realm,
  entityType: string,
  entityId: string,
  userId: string | null
): Promise<void> {
  realm.write(() => {
    const existing = realm.objectForPrimaryKey(entityType, buildPrimaryKey(entityType, entityId));
    if (existing) {
      realm.delete(existing);
    }
  });

  if (!userId || !isSyncSupported()) {
    return;
  }

  const success = await tryRemoteDelete(`users/${userId}/${entityType}`, entityId);
  if (!success) {
    console.warn(`[SyncService] Remote delete failed for ${entityType}/${entityId}. Firestore offline persistence will retry when possible.`);
  }
}

export function initializeSyncListeners(realm: Realm, userId: string) {
  if (!isSyncSupported()) {
    return;
  }

  cleanupSyncListeners();

  SYNC_ENTITY_TYPES.forEach((entityType) => {
    activeListeners.push(subscribeToCollection(realm, userId, entityType));
  });
}

export function cleanupSyncListeners() {
  activeListeners.forEach((unsubscribe) => unsubscribe());
  activeListeners = [];
}
