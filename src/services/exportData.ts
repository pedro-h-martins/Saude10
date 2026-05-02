import { Realm } from '@realm/react';
import * as FileSystem from 'expo-file-system';

export const EXPORT_CATEGORIES = [
  { key: 'profile', label: 'Perfil', entityType: 'UserProfile' },
  { key: 'goals', label: 'Metas', entityType: 'Goal' },
  { key: 'activities', label: 'Atividades', entityType: 'ActivityLog' },
  { key: 'bloodPressure', label: 'Pressão', entityType: 'BloodPressure' },
  { key: 'hydration', label: 'Hidratação', entityType: 'HydrationLog' },
  { key: 'pomodoro', label: 'Pomodoro', entityType: 'PomodoroLog' },
  { key: 'reminders', label: 'Lembretes', entityType: 'Reminder' },
  { key: 'symptoms', label: 'Sintomas', entityType: 'SymptomLog' },
  { key: 'wellness', label: 'Bem-estar', entityType: 'WellnessLog' },
  { key: 'workouts', label: 'Treinos', entityType: 'Workout' },
] as const;

export type ExportCategoryKey = (typeof EXPORT_CATEGORIES)[number]['key'];

function normalizeValue(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Realm.BSON.ObjectId) {
    return value.toHexString();
  }

  if (Array.isArray(value)) {
    return value.map(normalizeValue);
  }

  if (value && typeof value === 'object') {
    const listLike = (value as any).length !== undefined && typeof (value as any).map === 'function';
    if (listLike) {
      return Array.from(value as any).map(normalizeValue);
    }

    const converted: Record<string, unknown> = {};
    for (const [key, innerValue] of Object.entries(value as Record<string, unknown>)) {
      converted[key] = normalizeValue(innerValue);
    }
    return converted;
  }

  return value;
}

function normalizeRealmObject(realmObj: any): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};

  for (const key of Object.keys(realmObj)) {
    if (key === 'realm' || key === 'objectSchema' || key === 'isValid') {
      continue;
    }
    normalized[key] = normalizeValue(realmObj[key]);
  }

  return normalized;
}

async function normalizeRealmCollection(collection: Realm.Results<any> | Realm.List<any>): Promise<unknown[]> {
  return Array.from(collection).map(normalizeRealmObject);
}

export async function exportHealthData(
  realm: Realm,
  userId: string,
  categories: ExportCategoryKey[],
  destinationDirectoryUri: string
): Promise<{ uri: string; filename: string }> {
  const selectedCategories = EXPORT_CATEGORIES.filter((category) => categories.includes(category.key));

  const payload: Record<string, unknown> = {
    app: 'Saude10',
    userId,
    exportedAt: new Date().toISOString(),
    categories: selectedCategories.map((category) => category.label),
    data: {},
  };

  const dataPayload: Record<string, unknown[]> = {};

  for (const category of selectedCategories) {
    try {
      const collection = realm.objects(category.entityType);
      dataPayload[category.key] = await normalizeRealmCollection(collection as Realm.Results<any>);
    } catch (error) {
      console.warn('[exportHealthData] failed to export', category.entityType, error);
      dataPayload[category.key] = [];
    }
  }

  payload.data = dataPayload;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `saude10-export-${userId}-${timestamp}.json`;
  const directory = new FileSystem.Directory(destinationDirectoryUri);
  const file = directory.createFile(filename, 'application/json');
  file.write(JSON.stringify(payload, null, 2));

  return { uri: file.uri as string, filename };
}
