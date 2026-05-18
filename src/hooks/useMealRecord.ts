import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@/context/RealmProvider';
import { useSync } from '@/hooks/useSync';
import { MealLog } from '@/models/MealLog';
import { Realm } from '@realm/react';
import { useMemo } from 'react';

export function useMealRecord() {
  const { currentUser } = useAuth();
  const { save } = useSync();

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  
  const startOfDay = new Date(todayStr + 'T00:00:00');
  const endOfDay = new Date(todayStr + 'T23:59:59.999');

  const mealLogs = useQuery<MealLog>('MealLog', (collection) => {
    return collection
      .filtered('userId == $0 AND timestamp >= $1 AND timestamp <= $2', currentUser?._id || '', startOfDay, endOfDay)
      .sorted('timestamp', true);
  }, [currentUser?._id, todayStr]);

  const totals = useMemo(() => {
    return mealLogs.reduce((acc, log) => {
      acc.calories += log.calories || 0;
      acc.protein += log.protein || 0;
      acc.carbs += log.carbs || 0;
      acc.fat += log.fat || 0;
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [mealLogs]);

  const addMeal = async (mealData: { name: string; mealType: string; calories: number; protein?: number; carbs?: number; fat?: number; timestamp: Date }) => {
    if (!currentUser) return;
    
    const newId = new Realm.BSON.ObjectId();
    
    await save('MealLog', newId.toHexString(), {
      _id: newId,
      userId: currentUser._id,
      timestamp: mealData.timestamp,
      name: mealData.name,
      mealType: mealData.mealType,
      calories: mealData.calories,
      protein: mealData.protein || 0,
      carbs: mealData.carbs || 0,
      fat: mealData.fat || 0,
    });
  };

  return { mealLogs, totals, addMeal };
}
