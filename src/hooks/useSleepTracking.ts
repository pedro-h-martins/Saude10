import { useAuth } from '@/context/AuthContext';
import { useQuery, useRealm } from '@/context/RealmProvider';
import { SleepLog } from '@/models/SleepLog';
import { Realm } from '@realm/react';
import { useCallback } from 'react';
import { useSync } from './useSync';

export function useSleepTracking() {
  const realm = useRealm();
  const { currentUser } = useAuth();
  const user = currentUser;
  const { save, remove } = useSync();

  const sleepLogs = useQuery(SleepLog).sorted('startTime', true);

  const saveSleepLog = useCallback((data: {
    _id?: Realm.BSON.ObjectId;
    startTime: Date;
    endTime: Date;
    quality: number;
    notes?: string;
  }) => {
    if (!user) return;

    const id = data._id || new Realm.BSON.ObjectId();
    
    save('SleepLog', id.toHexString(), {
      _id: id,
      userId: user._id,
      startTime: data.startTime,
      endTime: data.endTime,
      quality: data.quality,
      notes: data.notes,
      updatedAt: new Date(),
    });
  }, [user, save]);

  const deleteSleepLog = useCallback((id: Realm.BSON.ObjectId) => {
    remove('SleepLog', id.toHexString());
  }, [remove]);

  const calculateDurationHours = (start: Date, end: Date) => {
    const diffMs = end.getTime() - start.getTime();
    if (diffMs < 0) return 0;
    return diffMs / (1000 * 60 * 60);
  };

  const formatDuration = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}min`;
  };

  return {
    sleepLogs,
    saveSleepLog,
    deleteSleepLog,
    calculateDurationHours,
    formatDuration,
  };
}
