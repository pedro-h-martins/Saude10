import { ActivityLog } from '@/models/ActivityLog';
import { BloodPressure } from '@/models/BloodPressure';
import { Goal } from '@/models/Goal';
import { HydrationLog } from '@/models/HydrationLog';
import { PomodoroLog } from '@/models/PomodoroLog';
import { Reminder } from '@/models/Reminder';
import { SymptomLog } from '@/models/SymptomLog';
import { UserProfile } from '@/models/UserProfile';
import { WellnessLog } from '@/models/WellnessLog';
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

export const RealmContext = createRealmContext({
  schema: [UserProfile, Goal, ActivityLog, PomodoroLog, BloodPressure, HydrationLog, Reminder, WellnessLog, SymptomLog],
  schemaVersion: 20,
  onMigration: (oldRealm, newRealm) => {
  },
  onFirstOpen: (realm) => {
    seedInitialGoals(realm);
  },
});

export const { RealmProvider, useRealm, useQuery, useObject } = RealmContext;

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
      {children}
    </RealmProvider>
  );
}
