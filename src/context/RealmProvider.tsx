import { ActivityLog } from '@/models/ActivityLog';
import { BloodPressure } from '@/models/BloodPressure';
import { FeedbackSurvey } from '@/models/FeedbackSurvey';
import { Goal } from '@/models/Goal';
import { HydrationLog } from '@/models/HydrationLog';
import { MealLog } from '@/models/MealLog';
import { PomodoroLog } from '@/models/PomodoroLog';
import { ProgressPhoto } from '@/models/ProgressPhoto';
import { Recipe } from '@/models/Recipe';
import { Reminder } from '@/models/Reminder';
import { SymptomLog } from '@/models/SymptomLog';
import { SyncQueueItem } from '@/models/SyncQueueItem';
import { UserProfile } from '@/models/UserProfile';
import { WellnessLog } from '@/models/WellnessLog';
import { Workout } from '@/models/Workout';
import { createRealmContext, Realm } from '@realm/react';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-get-random-values';


const ENCRYPTION_KEY_ID = 'realm_encryption_key_v1';

export async function getEncryptionKey(): Promise<Uint8Array> {
  let keyString = await SecureStore.getItemAsync(ENCRYPTION_KEY_ID);

  if (!keyString) {
    const key = new Uint8Array(64);
    crypto.getRandomValues(key);
    keyString = Array.from(key)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    await SecureStore.setItemAsync(ENCRYPTION_KEY_ID, keyString);
  }

  const key = new Uint8Array(64);
  for (let i = 0; i < 64; i++) {
    key[i] = parseInt(keyString.substring(i * 2, i * 2 + 2), 16);
  }
  return key;
}

const PREDEFINED_GOALS = [
  { type: 'steps', title: 'Caminhar 10.000 passos por dia', metric: 'steps', targetValue: 10000, unit: 'passos', periodType: 'daily' },
  { type: 'hydration', title: 'Beber 2L de água por dia', metric: 'hydration', targetValue: 2000, unit: 'ml', periodType: 'daily' },
  { type: 'meditation', title: 'Meditar 3x por semana', metric: 'meditation', targetValue: 3, unit: 'sessões', periodType: 'weekly' },
  { type: 'lose-weight', title: 'Perder peso', metric: 'weight', targetValue: null, unit: 'kg', periodType: 'custom' },
];

export const seedInitialGoals = (realm: Realm) => {
  const existingGoals = realm.objects(Goal);
  if (existingGoals.length === 0) {
    realm.write(() => {
      PREDEFINED_GOALS.forEach((goal) => {
        realm.create(Goal, {
          _id: new Realm.BSON.ObjectId(),
          type: goal.type,
          title: goal.title,
          metric: (goal as any).metric ?? undefined,
          targetValue: (goal as any).targetValue ?? undefined,
          unit: (goal as any).unit ?? undefined,
          periodType: (goal as any).periodType ?? undefined,
          periodValue: (goal as any).periodValue ?? undefined,
          startDate: new Date(),
          isActive: true,
        });
      });
    });
  }
};

const getNextDateAt = (hour: number, minute: number) => {
  const next = new Date();
  next.setHours(hour, minute, 0, 0);
  if (next <= new Date()) {
    next.setDate(next.getDate() + 1);
  }
  return next;
};

const getNextWeekdayAt = (weekday: number, hour: number, minute: number) => {
  const today = new Date();
  const next = new Date(today);
  const delta = (weekday + 7 - today.getDay()) % 7 || 7;
  next.setDate(today.getDate() + delta);
  next.setHours(hour, minute, 0, 0);
  return next;
};

const PREDEFINED_WORKOUTS = [
  {
    title: 'Caminhada matinal',
    instructions: 'Caminhe por 20 minutos em ritmo confortável. Respire profundamente e alongue as pernas antes e depois.',
    isPredefined: true,
    isRecurring: true,
    recurrenceRule: 'daily' as const,
    nextOccurrence: getNextDateAt(7, 0),
  },
  {
    title: 'Treino de força rápida',
    instructions: 'Faça 3 séries de 12 agachamentos, 10 flexões e 15 abdominais. Descanse 30 segundos entre as séries.',
    isPredefined: true,
    isRecurring: true,
    recurrenceRule: 'weekly' as const,
    nextOccurrence: getNextWeekdayAt(1, 18, 0),
  },
  {
    title: 'Alongamento noturno',
    instructions: 'Realize alongamentos suaves para pescoço, ombros, costas e pernas por 10 minutos antes de dormir.',
    isPredefined: true,
    isRecurring: true,
    recurrenceRule: 'daily' as const,
    nextOccurrence: getNextDateAt(20, 0),
  },
];

const PREDEFINED_RECIPES = [
  {
    title: 'Smoothie de Banana e Aveia',
    category: 'pós-treino',
    ingredients: '1 banana madura; 2 colheres de aveia; 1 copo de leite vegetal; 1 scoop de whey (opcional)',
    instructions: '1. Coloque todos os ingredientes no liquidificador.\n2. Bata até ficar homogêneo.\n3. Sirva gelado.',
    prepTime: '5 min',
    calories: '250 kcal',
  },
  {
    title: 'Omelete Low Carb com Espinafre',
    category: 'low carb',
    ingredients: '2 ovos; 1 xícara de espinafre picado; Sal e pimenta a gosto; 1 colher de chá de azeite',
    instructions: '1. Bata os ovos com sal e pimenta.\n2. Refogue o espinafre no azeite.\n3. Despeje os ovos sobre o espinafre e cozinhe em fogo baixo.\n4. Vire para dourar os dois lados.',
    prepTime: '10 min',
    calories: '180 kcal',
  },
  {
    title: 'Salada de Frango com Quinoa',
    category: 'pós-treino',
    ingredients: '100g de peito de frango grelhado; 1/2 xícara de quinoa cozida; Pepino e tomate em cubos; Suco de limão',
    instructions: '1. Misture a quinoa, o frango, o pepino e o tomate.\n2. Tempere com suco de limão, sal e um fio de azeite.\n3. Sirva frio.',
    prepTime: '15 min',
    calories: '320 kcal',
  },
  {
    title: 'Pudim de Chia com Frutas Vermelhas',
    category: 'low carb',
    ingredients: '3 colheres de sopa de sementes de chia; 200ml de leite de amêndoas; 5 morangos picados',
    instructions: '1. Misture a chia com o leite e deixe na geladeira por pelo menos 4 horas.\n2. Sirva com os morangos por cima.',
    prepTime: '5 min',
    calories: '150 kcal',
  }
];

export const seedPredefinedWorkouts = (realm: Realm) => {
  const existingWorkouts = realm.objects(Workout);
  if (existingWorkouts.length === 0) {
    realm.write(() => {
      PREDEFINED_WORKOUTS.forEach((workout) => {
        realm.create(Workout, {
          _id: new Realm.BSON.ObjectId(),
          title: workout.title,
          instructions: workout.instructions,
          isPredefined: workout.isPredefined,
          isRecurring: workout.isRecurring,
          recurrenceRule: workout.recurrenceRule,
          nextOccurrence: workout.nextOccurrence,
          createdAt: new Date(),
        });
      });
    });
  }
};

export const seedInitialRecipes = (realm: Realm) => {
  const existingRecipes = realm.objects(Recipe);
  if (existingRecipes.length === 0) {
    realm.write(() => {
      PREDEFINED_RECIPES.forEach((recipe) => {
        realm.create(Recipe, {
          _id: new Realm.BSON.ObjectId(),
          ...recipe,
          isFavorite: false,
        });
      });
    });
  }
};

export const RealmContext = createRealmContext({
  schema: [UserProfile, Goal, ActivityLog, PomodoroLog, BloodPressure, HydrationLog, Reminder, SymptomLog, Workout, ProgressPhoto, FeedbackSurvey, SyncQueueItem, WellnessLog, MealLog, Recipe],
  schemaVersion: 30
});

export const { RealmProvider, useRealm, useQuery, useObject } = RealmContext;

function SeedRealmData() {
  const realm = useRealm();

  useEffect(() => {
    seedInitialGoals(realm);
    seedPredefinedWorkouts(realm);
    seedInitialRecipes(realm);
  }, [realm]);

  return null;
}

export function EncryptedDatabaseProvider({ children, fallback }: { children: React.ReactNode, fallback?: React.ReactElement | null }) {
  const [encryptionKey, setEncryptionKey] = useState<Uint8Array | null>(null);

  useEffect(() => {
    getEncryptionKey()
      .then(setEncryptionKey)
      .catch(console.error);
  }, []);

  if (!encryptionKey) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <RealmProvider encryptionKey={encryptionKey} fallback={fallback}>
      <SeedRealmData />
      {children}
    </RealmProvider>
  );
}
