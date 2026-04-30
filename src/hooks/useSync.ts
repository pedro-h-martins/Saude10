import { useAuth } from '@/context/AuthContext';
import { useRealm } from '@/context/RealmProvider';
import { deleteEntity, saveEntity } from '@/sync/SyncService';
import { useCallback } from 'react';

export function useSync() {
  const realm = useRealm();
  const { currentUser } = useAuth();

  const save = useCallback(
    async (entityType: string, entityId: string, data: any) => {
      if (!currentUser) return;
      await saveEntity(realm, entityType, entityId, data, currentUser._id);
    },
    [realm, currentUser]
  );

  const remove = useCallback(
    async (entityType: string, entityId: string) => {
      if (!currentUser) return;
      await deleteEntity(realm, entityType, entityId, currentUser._id);
    },
    [realm, currentUser]
  );

  return { save, remove };
}
