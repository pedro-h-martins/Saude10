import { ActivityLog } from '@/models/ActivityLog';
import { BloodPressure } from '@/models/BloodPressure';
import { Goal } from '@/models/Goal';
import { HydrationLog } from '@/models/HydrationLog';
import { PomodoroLog } from '@/models/PomodoroLog';
import { Reminder } from '@/models/Reminder';
import { SymptomLog } from '@/models/SymptomLog';
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
  { type: 'lose-weight', title: 'Perder peso' },
  { type: 'gain-muscle', title: 'Ganhar massa muscular' },
  { type: 'reduce-stress', title: 'Reduzir estresse' },
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

export const RealmContext = createRealmContext({
  schema: [UserProfile, Goal, ActivityLog, PomodoroLog, BloodPressure, HydrationLog, Reminder, WellnessLog, SymptomLog, Workout],
  schemaVersion: 22
});

export const { RealmProvider, useRealm, useQuery, useObject } = RealmContext;

function SeedRealmData() {
  const realm = useRealm();

  useEffect(() => {
    seedInitialGoals(realm);
    seedPredefinedWorkouts(realm);
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
