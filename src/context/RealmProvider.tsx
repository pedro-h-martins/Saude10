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

export const RealmContext = createRealmContext({
  schema: [UserProfile, Goal, ActivityLog, PomodoroLog, BloodPressure, HydrationLog, Reminder, WellnessLog, SymptomLog],
  schemaVersion: 16,
  onMigration: (oldRealm, newRealm) => {
    if (oldRealm.schemaVersion < 15) {
      const newUsers = newRealm.objects('UserProfile');
      for (let i = 0; i < newUsers.length; i++) {
        const u: any = newUsers[i];
        if (u && typeof u.avatarUri === 'undefined') {
          u.avatarUri = null;
        }
      }
    }
  },
  onFirstOpen: (realm) => {
  },
});

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

export const { RealmProvider, useRealm, useQuery, useObject } = RealmContext;
