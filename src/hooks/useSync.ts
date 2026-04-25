import { useAuth } from '@/context/AuthContext';
import { useRealm } from '@/context/RealmProvider';
import { processSyncQueue, saveEntity, deleteEntity } from '@/sync/SyncService';
import { isOnline } from '@/utils/network';
import { useCallback, useEffect } from 'react';
import { AppState, Platform } from 'react-native';

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

  useEffect(() => {
    if (!currentUser || Platform.OS === 'web') return;

    let syncInterval: ReturnType<typeof setInterval>;

    const runSync = async () => {
      const online = await isOnline();
      if (online) {
        await processSyncQueue(realm, currentUser._id);
      }
    };

    runSync();

    syncInterval = setInterval(runSync, 60000);

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        runSync();
      }
    });

    return () => {
      clearInterval(syncInterval);
      subscription.remove();
    };
  }, [realm, currentUser]);

  return { save, remove };
}
