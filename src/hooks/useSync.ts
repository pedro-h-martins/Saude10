import { useAuth } from '@/context/AuthContext';
import { useRealm } from '@/context/RealmProvider';
import { deleteEntity, saveEntity } from '@/sync/SyncService';
import { useCallback } from 'react';

export function useSync() {
  const realm = useRealm();
  const { currentUser } = useAuth();

  const save = useCallback(
    async (entityType: string, entityId: string, data: any) => {
      await saveEntity(realm, entityType, entityId, data, currentUser?._id ?? null);
    },
    [realm, currentUser]
  );

  const remove = useCallback(
    async (entityType: string, entityId: string) => {
      await deleteEntity(realm, entityType, entityId, currentUser?._id ?? null);
    },
    [realm, currentUser]
  );

  return { save, remove };
}
