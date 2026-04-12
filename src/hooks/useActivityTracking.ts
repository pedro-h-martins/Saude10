import { DEFAULT_METERS_PER_STEP } from '@/constants/defaults';
import { useAuth } from '@/context/AuthContext';
import { useRealm } from '@/context/RealmProvider';
import { ActivityLog } from '@/models/ActivityLog';
import { calculateDistance, fetchStepsForPeriod, requestActivityPermissions } from '@/utils/health';
import { Pedometer } from 'expo-sensors';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

export function useActivityTracking() {
  const realm = useRealm();
  const { currentUser } = useAuth();
  const user = currentUser;

  const [steps, setSteps] = useState(0);
  const [distanceMeters, setDistanceMeters] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const lastBaseSteps = useRef(0);

  const syncCurrentDay = useCallback(async () => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const totalSteps = await fetchStepsForPeriod(startOfToday, endOfToday);
    const estimatedDistanceMeters = user ? calculateDistance(totalSteps, user.height) : totalSteps * DEFAULT_METERS_PER_STEP;

    setSteps(totalSteps);
    setDistanceMeters(estimatedDistanceMeters);

    realm.write(() => {
      const existingLog = realm.objects(ActivityLog).filtered('date == $0', dateStr)[0];
      if (existingLog) {
        existingLog.steps = totalSteps;
        existingLog.distance = estimatedDistanceMeters;
        existingLog.updatedAt = new Date();
      } else {
        realm.create(ActivityLog, {
          _id: new Realm.BSON.ObjectId(),
          date: dateStr,
          steps: totalSteps,
          distance: estimatedDistanceMeters,
          updatedAt: new Date(),
        });
      }
    });
  }, [realm, user]);

  const updateAndroidSteps = useCallback((newStepsSinceStart: number) => {
    const totalSteps = lastBaseSteps.current + newStepsSinceStart;
    const estimatedDistanceMeters = user ? calculateDistance(totalSteps, user.height) : totalSteps * DEFAULT_METERS_PER_STEP;
    const dateStr = new Date().toISOString().split('T')[0];

    setSteps(totalSteps);
    setDistanceMeters(estimatedDistanceMeters);

    realm.write(() => {
      const existingLog = realm.objects(ActivityLog).filtered('date == $0', dateStr)[0];
      if (existingLog) {
        existingLog.steps = totalSteps;
        existingLog.distance = estimatedDistanceMeters;
        existingLog.updatedAt = new Date();
      } else {
        realm.create(ActivityLog, {
          _id: new Realm.BSON.ObjectId(),
          date: dateStr,
          steps: totalSteps,
          distance: estimatedDistanceMeters,
          updatedAt: new Date(),
        });
      }
    });
  }, [realm, user]);

  useEffect(() => {
    let subscription: Pedometer.PedometerResult | any = null;

    async function initialize() {
      const hasPermissions = await requestActivityPermissions();
      if (!hasPermissions) {
        console.warn('Physical activity tracking permissions not granted.');
        return;
      }

      const isPedometerAvailable = await Pedometer.isAvailableAsync();
      if (!isPedometerAvailable) return;

      setIsTracking(true);

      if (Platform.OS !== 'android') {
        await syncCurrentDay();
      } else {
        const today = new Date().toISOString().split('T')[0];
        const existingLog = realm.objects(ActivityLog).filtered('date == $0', today)[0];
        if (existingLog) {
          setSteps(existingLog.steps);
          setDistanceMeters(existingLog.distance);
          lastBaseSteps.current = existingLog.steps;
        }
      }
      
      subscription = Pedometer.watchStepCount((result) => {
        if (Platform.OS === 'android') {
          updateAndroidSteps(result.steps);
        } else {
          syncCurrentDay();
        }
      });
    }

    initialize();
    if (Platform.OS === 'android') return;

    const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        syncCurrentDay();
      }
    });

    return () => {
      subscription?.remove();
      appStateSubscription.remove();
    };
  }, [realm, syncCurrentDay, updateAndroidSteps]);

  const formattedDistance = distanceMeters >= 1000 
    ? `${(distanceMeters / 1000).toFixed(1)} km` 
    : `${Math.round(distanceMeters)} m`;

  return {
    steps,
    distanceMeters,
    formattedDistance,
    isTracking,
    syncCurrentDay,
  };
}
