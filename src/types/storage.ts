import { BabyProfile, SleepSession, LearnerState, NotificationLogEntry } from './index';

export interface StorageSchema {
  version: number;
  babyProfile: BabyProfile | null;
  sleepSessions: SleepSession[];
  learnerState: LearnerState | null;
  notificationLog: NotificationLogEntry[];
}

export const CURRENT_SCHEMA_VERSION = 1;
