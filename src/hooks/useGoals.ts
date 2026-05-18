import { useQuery, useRealm } from '@/context/RealmProvider';
import { ActivityLog } from '@/models/ActivityLog';
import { Goal } from '@/models/Goal';
import { HydrationLog } from '@/models/HydrationLog';
import { PomodoroLog } from '@/models/PomodoroLog';
import { Workout } from '@/models/Workout';
import { useCallback, useMemo } from 'react';
import { useSync } from './useSync';

function toDateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function startOfDay(d: Date) {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function endOfDay(d: Date) {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
}

function startOfWeek(d: Date) {
  const r = new Date(d);
  const day = r.getDay();
  const diff = r.getDate() - day + (day === 0 ? -6 : 1);
  r.setDate(diff);
  r.setHours(0, 0, 0, 0);
  return r;
}

export function useGoals() {
  const realm = useRealm();
  const goals = useQuery(Goal);
  const activityLogs = useQuery(ActivityLog);
  const hydrationLogs = useQuery(HydrationLog);
  const pomodoroLogs = useQuery(PomodoroLog);
  const workouts = useQuery(Workout);
  const { save, remove } = useSync();

  const computed = useMemo(() => {
    const now = new Date();
    const todayKey = toDateKey(now);
    const weekStart = startOfWeek(now);
    const weekEnd = endOfDay(new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000));

    return goals.map((g) => {
      let currentValue = 0;

      const metric = (g as any).metric ?? 'custom';
      const periodType = (g as any).periodType ?? 'daily';

      try {
        if (metric === 'steps') {
          const dayLogs = activityLogs.filtered('date == $0', todayKey);
          currentValue = dayLogs.reduce((sum: number, l: any) => sum + (l.steps ?? 0), 0);
        } else if (metric === 'hydration') {
          const start = startOfDay(now);
          const end = endOfDay(now);
          const dayHydration = hydrationLogs.filtered('timestamp >= $0 AND timestamp <= $1', start, end);
          currentValue = dayHydration.reduce((sum: number, l: any) => sum + (l.amount ?? 0), 0);
        } else if (metric === 'meditation') {
          if (periodType === 'weekly') {
            const pomos = pomodoroLogs.filtered('completedAt >= $0 AND completedAt <= $1', weekStart, weekEnd);
            currentValue = pomos.length;
          } else {
            const start = startOfDay(now);
            const end = endOfDay(now);
            const pomos = pomodoroLogs.filtered('completedAt >= $0 AND completedAt <= $1', start, end);
            currentValue = pomos.length;
          }
        } else if (metric === 'workout') {
          if (periodType === 'weekly') {
            const completed = workouts.filtered('(completedAt != null AND completedAt >= $0 AND completedAt <= $1) OR (lastCompletedAt != null AND lastCompletedAt >= $0 AND lastCompletedAt <= $1)', weekStart, weekEnd);
            currentValue = completed.length;
          } else {
            const start = startOfDay(now);
            const completed = workouts.filtered('(completedAt != null AND completedAt >= $0 AND completedAt <= $1) OR (lastCompletedAt != null AND lastCompletedAt >= $0 AND lastCompletedAt <= $1)', start, endOfDay(now));
            currentValue = completed.length;
          }
        } else if (metric === 'weight') {
          const user = realm.objects('UserProfile')[0] as any;
          currentValue = user?.weight ?? 0;
        } else {
          currentValue = (g as any).currentValue ?? 0;
        }
      } catch (err) {
        console.warn('[useGoals] compute error', err);
        currentValue = (g as any).currentValue ?? 0;
      }

      const target = (g as any).targetValue ?? 0;
      const progressPercent = target > 0 ? Math.min(1, currentValue / target) : 0;

      const displayText = target > 0 ? `${Math.round(currentValue)} / ${target} ${(g as any).unit ?? ''}`.trim() : `${Math.round(currentValue)}`;

      return {
        goal: g,
        currentValue,
        progressPercent,
        displayText,
      };
    });
  }, [goals, activityLogs, hydrationLogs, pomodoroLogs, workouts, realm]);

  const updateGoal = useCallback(
    async (id: string, patch: any) => {
      await save('Goal', id, patch);
    },
    [save]
  );

  const deleteGoal = useCallback(
    async (id: string) => {
      await remove('Goal', id);
    },
    [remove]
  );

  return { computed, updateGoal, deleteGoal };
}

export default useGoals;
