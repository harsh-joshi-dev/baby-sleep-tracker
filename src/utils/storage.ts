import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageSchema, CURRENT_SCHEMA_VERSION } from '../types/storage';
import { BabyProfile, SleepSession, LearnerState, NotificationLogEntry } from '../types';

const STORAGE_KEY = 'sleep_pattern_learner_data';

async function migrateSchema(data: any): Promise<StorageSchema> {
  if (!data || typeof data.version !== 'number') {
    return createEmptySchema();
  }
  if (data.version === CURRENT_SCHEMA_VERSION) {
    return data as StorageSchema;
  }
  return createEmptySchema();
}

function createEmptySchema(): StorageSchema {
  return {
    version: CURRENT_SCHEMA_VERSION,
    babyProfile: null,
    sleepSessions: [],
    learnerState: null,
    notificationLog: [],
  };
}

export async function loadStorage(): Promise<StorageSchema> {
  try {
    const rawData = await AsyncStorage.getItem(STORAGE_KEY);
    if (!rawData) {
      return createEmptySchema();
    }
    const data = JSON.parse(rawData);
    return await migrateSchema(data);
  } catch (error) {
    return createEmptySchema();
  }
}

export async function saveStorage(schema: StorageSchema): Promise<void> {
  try {
    const serialized = JSON.stringify(schema);
    await AsyncStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    throw new Error('Failed to save storage');
  }
}

export async function resetStorage(): Promise<StorageSchema> {
  const emptySchema = createEmptySchema();
  await saveStorage(emptySchema);
  return emptySchema;
}

export async function saveBabyProfile(profile: BabyProfile): Promise<void> {
  const schema = await loadStorage();
  schema.babyProfile = profile;
  await saveStorage(schema);
}

export async function saveSleepSession(session: SleepSession): Promise<void> {
  const schema = await loadStorage();
  const index = schema.sleepSessions.findIndex((s) => s.id === session.id);
  if (index >= 0) {
    schema.sleepSessions[index] = session;
  } else {
    schema.sleepSessions.push(session);
  }
  await saveStorage(schema);
}

export async function deleteSleepSession(sessionId: string): Promise<void> {
  const schema = await loadStorage();
  const session = schema.sleepSessions.find((s) => s.id === sessionId);
  if (session) {
    session.deleted = true;
    session.updatedAtISO = new Date().toISOString();
    await saveStorage(schema);
  }
}

export async function saveLearnerState(state: LearnerState): Promise<void> {
  const schema = await loadStorage();
  schema.learnerState = state;
  await saveStorage(schema);
}

export async function saveNotificationLogEntry(entry: NotificationLogEntry): Promise<void> {
  const schema = await loadStorage();
  const index = schema.notificationLog.findIndex((e) => e.id === entry.id);
  if (index >= 0) {
    schema.notificationLog[index] = entry;
  } else {
    schema.notificationLog.push(entry);
  }
  await saveStorage(schema);
}

export async function getAllSleepSessions(): Promise<SleepSession[]> {
  const schema = await loadStorage();
  return schema.sleepSessions.filter((s) => !s.deleted);
}
