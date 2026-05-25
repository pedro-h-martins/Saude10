import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@/context/RealmProvider';
import { ActivityLog } from '@/models/ActivityLog';
import { Workout } from '@/models/Workout';
import { useMemo } from 'react';

export function useWaterGoal() {
  const { currentUser } = useAuth();
  const user = currentUser;

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const workouts = useQuery(Workout, (collection) =>
    collection.filtered('createdAt >= $0', today)
  );

  const activityLogs = useQuery(ActivityLog, (collection) =>
    collection.filtered('date >= $0', today.toISOString().split('T')[0])
  );

  const baseGoal = useMemo(() => {
    if (!user?.weight) return 2000;
    return Math.round(user.weight * 35);
  }, [user]);

  const hasIntenseExercise = useMemo(() => {
    const hasIntenseWorkout = workouts.some(
      (workout) => workout.intensity === 'high'
    );

    const hasIntenseActivity = activityLogs.some(
      (log) => log.intensity === 'high'
    );

    return hasIntenseWorkout || hasIntenseActivity;
  }, [workouts, activityLogs]);

  const targetGoal = hasIntenseExercise ? Math.round(baseGoal * 1.15) : baseGoal;

  return {
    baseGoal,
    targetGoal,
    isAdjusted: hasIntenseExercise,
    adjustmentReason: hasIntenseExercise ? 'exercise_intensity' : undefined,
  };
}
