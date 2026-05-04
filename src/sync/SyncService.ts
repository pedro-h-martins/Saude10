import { SyncQueueItem } from '@/models/SyncQueueItem';
import { getUserEntityCollection, getUserEntityDocRef } from '@/services/firebase';
import { isOnline } from '@/utils/network';
import { deleteDoc, getDoc, onSnapshot, setDoc } from '@react-native-firebase/firestore';
import { Realm } from '@realm/react';
import 'react-native-get-random-values';

const SYNC_ENTITY_TYPES = [
  'UserProfile',
  'Goal',
  'ActivityLog',
  'BloodPressure',
  'FeedbackSurvey',
  'HydrationLog',
  'PomodoroLog',
  'Reminder',
  'SymptomLog',
  'WellnessLog',
  'Workout',
  'ProgressPhoto',
];

const listeners: (() => void)[] = [];

function normalizeValue(value: unknown): unknown {
  if (value instanceof Date) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(normalizeValue);
  }

  if (value && typeof value === 'object') {
    const converted: Record<string, unknown> = {};

    if ('toDate' in value && typeof (value as any).toDate === 'function') {
      return (value as any).toDate();
    }

    if (value instanceof Realm.BSON.ObjectId) {
      return value.toHexString();
    }

    for (const [key, innerValue] of Object.entries(value as Record<string, unknown>)) {
      converted[key] = normalizeValue(innerValue);
    }
    return converted;
  }

  return value;
}

function normalizeDataForFirestore(data: any) {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const converted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (key === '_id' || key === 'localUri') {
      continue;
    }
    converted[key] = normalizeValue(value);
  }
  return converted;
}

const OBJECT_ID_ENTITY_TYPES = new Set([
  'Goal',
  'ActivityLog',
  'BloodPressure',
  'FeedbackSurvey',
  'HydrationLog',
  'PomodoroLog',
  'Reminder',
  'SymptomLog',
  'WellnessLog',
  'Workout',
  'ProgressPhoto',
]);

function buildRemoteDocRef(userId: string, entityType: string, entityId: string) {
  return getUserEntityDocRef(userId, entityType, entityId);
}

function getRealmPrimaryKey(entityType: string, entityId: string) {
  if (!OBJECT_ID_ENTITY_TYPES.has(entityType)) {
    return entityId;
  }

  return typeof entityId === 'string' ? new Realm.BSON.ObjectId(entityId) : entityId;
}

function createPendingSync(
  realm: Realm,
  userId: string,
  entityType: string,
  entityId: string,
  operation: 'set' | 'delete',
  payload?: any
) {
  realm.write(() => {
    realm.create(
      SyncQueueItem,
      {
        _id: new Realm.BSON.ObjectId(),
        userId,
        entityType,
        entityId,
        operation,
        payload: payload ? normalizeDataForFirestore(payload) : null,
        status: 'pending',
        attempts: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      Realm.UpdateMode.Modified
    );
  });
}

function clearPendingSync(realm: Realm, userId: string, entityType: string, entityId: string, operation: 'set' | 'delete') {
  const pending = realm
    .objects<SyncQueueItem>(SyncQueueItem)
    .filtered('userId == $0 AND entityType == $1 AND entityId == $2 AND operation == $3', userId, entityType, entityId, operation);

  if (pending.length === 0) {
    return;
  }

  realm.write(() => {
    realm.delete(pending);
  });
}

function markProgressPhotoSynced(realm: Realm, entityId: string) {
  const photo = realm.objectForPrimaryKey('ProgressPhoto', new Realm.BSON.ObjectId(entityId));
  if (!photo) {
    return;
  }

  realm.write(() => {
    (photo as any).status = 'synced';
    (photo as any).updatedAt = new Date();
  });
}

async function flushPendingQueue(realm: Realm, userId: string) {
  if (!(await isOnline())) {
    return;
  }

  const pending = realm
    .objects<SyncQueueItem>(SyncQueueItem)
    .filtered('userId == $0 AND status == $1', userId, 'pending');

  const toDelete: Realm.Object[] = [];

  for (const item of pending) {
    try {
      const ref = buildRemoteDocRef(userId, item.entityType, item.entityId);
      if (item.operation === 'set') {
        await setDoc(ref, item.payload ?? {}, { merge: true });
        if (item.entityType === 'ProgressPhoto') {
          markProgressPhotoSynced(realm, item.entityId);
        }
      } else {
        await deleteDoc(ref);
      }

      toDelete.push(item as unknown as Realm.Object);
    } catch (error) {
      console.warn('[SyncService] pending queue item sync failed', error);
      realm.write(() => {
        item.attempts += 1;
        item.status = item.attempts >= 3 ? 'failed' : 'pending';
        item.updatedAt = new Date();
      });
    }
  }

  if (toDelete.length > 0) {
    realm.write(() => {
      realm.delete(toDelete);
    });
  }
}

function getRealmSchema(realm: Realm, entityType: string) {
  return realm.schema.find((schema) => schema.name === entityType);
}

function isPropertyOptional(property: any) {
  if (typeof property === 'string') {
    return property.endsWith('?');
  }
  if (property && typeof property === 'object') {
    if (typeof property.type === 'string') {
      return property.type.endsWith('?');
    }
    return property.optional === true;
  }
  return false;
}

function hasDefaultProperty(property: any) {
  return property && typeof property === 'object' && property.default !== undefined;
}

function hasRequiredRealmFields(realm: Realm, entityType: string, data: Record<string, unknown>) {
  const schema = getRealmSchema(realm, entityType);
  if (!schema) {
    return true;
  }

  for (const [key, property] of Object.entries(schema.properties)) {
    if (key === '_id') {
      continue;
    }
    if (isPropertyOptional(property) || hasDefaultProperty(property)) {
      continue;
    }
    if (!Object.prototype.hasOwnProperty.call(data, key)) {
      return false;
    }
    const value = data[key];
    if (value === undefined || value === null) {
      return false;
    }
  }

  return true;
}

function mergeRemoteDocument(realm: Realm, entityType: string, entityId: string, data: Record<string, unknown>) {
  const payload = {
    _id: getRealmPrimaryKey(entityType, entityId),
    ...data,
  };

  const existing = realm.objectForPrimaryKey(entityType, payload._id);
  if (!existing && !hasRequiredRealmFields(realm, entityType, data)) {
    console.warn(`[SyncService] Skipping remote ${entityType} ${entityId} due to missing required fields`, data);
    return;
  }

  realm.create(entityType, payload, Realm.UpdateMode.Modified);
}

export async function tryRemoteRead(collectionPath: string, entityId: string) {
  if (!collectionPath || !entityId) {
    throw new Error('Remote read requires a collection path and entity id');
  }

  const segments = collectionPath.split('/');
  if (segments.length !== 3 || segments[0] !== 'users') {
    throw new Error('Unsupported collection path: ' + collectionPath);
  }

  const [, userId, entityType] = segments;
  const snapshot = await getDoc(buildRemoteDocRef(userId, entityType, entityId));

  if (!snapshot.exists()) {
    return null;
  }

  return normalizeValue(snapshot.data());
}

export async function saveEntity(
  realm: Realm,
  entityType: string,
  entityId: string,
  data: any,
  userId: string | null
) {
  const payload = {
    ...data,
    _id: getRealmPrimaryKey(entityType, entityId),
    updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
  };

  realm.write(() => {
    realm.create(entityType, payload, Realm.UpdateMode.Modified);
  });

  if (!userId) {
    return;
  }

  const remotePayload = normalizeDataForFirestore(payload);

  if (await isOnline()) {
    try {
      await setDoc(buildRemoteDocRef(userId, entityType, entityId), remotePayload, { merge: true });
      if (entityType === 'ProgressPhoto') {
        markProgressPhotoSynced(realm, entityId);
      }
      clearPendingSync(realm, userId, entityType, entityId, 'set');
      return;
    } catch (error) {
      console.warn('[SyncService] Remote save failed, queueing locally', error);
    }
  }

  createPendingSync(realm, userId, entityType, entityId, 'set', payload);
}

export async function deleteEntity(realm: Realm, entityType: string, entityId: string, userId: string | null) {
  const primaryKey = getRealmPrimaryKey(entityType, entityId);
  const localObject = realm.objectForPrimaryKey(entityType, primaryKey);

  if (localObject) {
    realm.write(() => {
      realm.delete(localObject);
    });
  }

  if (!userId) {
    return;
  }

  if (await isOnline()) {
    try {
      await deleteDoc(buildRemoteDocRef(userId, entityType, entityId));
      clearPendingSync(realm, userId, entityType, entityId, 'delete');
      return;
    } catch (error) {
      console.warn('[SyncService] Remote delete failed, queueing locally', error);
    }
  }

  createPendingSync(realm, userId, entityType, entityId, 'delete');
}

export async function initializeSyncListeners(realm: Realm, userId: string) {
  cleanupSyncListeners();

  try {
    for (const entityType of SYNC_ENTITY_TYPES) {
      const collection = getUserEntityCollection(userId, entityType);
      const unsubscribe = onSnapshot(
        collection,
        (snapshot) => {
          if (!snapshot) {
            return;
          }
          realm.write(() => {
            snapshot.docChanges().forEach((change) => {
              const normalized = normalizeValue(change.doc.data() ?? {}) as Record<string, unknown>;
              if (change.type === 'removed') {
                const existing = realm.objectForPrimaryKey(entityType, getRealmPrimaryKey(entityType, change.doc.id));
                if (existing) {
                  realm.delete(existing);
                }
                return;
              }

              mergeRemoteDocument(realm, entityType, change.doc.id, normalized);
            });
          });
        },
        (error) => {
          console.warn(`[SyncService] snapshot listener failed for ${entityType}:`, error);
        }
      );

      listeners.push(unsubscribe);
    }

    if (await isOnline()) {
      await flushPendingQueue(realm, userId);
    }
  } catch (error) {
    console.warn('[SyncService] initializeSyncListeners failed', error);
  }
}

export function cleanupSyncListeners() {
  while (listeners.length > 0) {
    const unsubscribe = listeners.shift();
    unsubscribe?.();
  }
}
