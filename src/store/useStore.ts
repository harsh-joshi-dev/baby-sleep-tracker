import 'react-native-get-random-values';
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { BabyProfile, SleepSession, LearnerState, ScheduleBlock, CoachTip } from '../types';
import {
  loadStorage,
  saveBabyProfile,
  saveSleepSession,
  deleteSleepSession as deleteSessionStorage,
  saveLearnerState,
  getAllSleepSessions,
  resetStorage,
} from '../utils/storage';
import { updateLearner } from '../models/learner';
import { generateSchedule, generateScheduleWithAdjustment } from '../models/schedule';
import { analyzeAndGenerateTips } from '../models/coach';
import { scheduleBlockNotifications, cancelAllNotifications, requestPermissions } from '../utils/notifications';
import { nowISO } from '../utils/timeUtils';

interface AppState {
  babyProfile: BabyProfile | null;
  sleepSessions: SleepSession[];
  learnerState: LearnerState | null;
  scheduleBlocks: ScheduleBlock[];
  coachTips: CoachTip[];
  activeTimerStart: string | null;
  wakeWindowAdjustment: number;
  isLoading: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  setBabyProfile: (profile: BabyProfile) => Promise<void>;
  addSleepSession: (session: Omit<SleepSession, 'id' | 'updatedAtISO'>) => Promise<void>;
  updateSleepSession: (session: SleepSession) => Promise<void>;
  deleteSleepSession: (sessionId: string) => Promise<void>;
  startTimer: () => void;
  stopTimer: () => Promise<void>;
  cancelTimer: () => void;
  setWakeWindowAdjustment: (minutes: number) => void;
  resetData: () => Promise<void>;
  refreshLearnerAndSchedule: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  babyProfile: null,
  sleepSessions: [],
  learnerState: null,
  scheduleBlocks: [],
  coachTips: [],
  activeTimerStart: null,
  wakeWindowAdjustment: 0,
  isLoading: true,
  error: null,

  initialize: async () => {
    try {
      set({ isLoading: true, error: null });
      await requestPermissions();
      const storage = await loadStorage();
      set({
        babyProfile: storage.babyProfile,
        sleepSessions: storage.sleepSessions.filter((s) => !s.deleted),
        learnerState: storage.learnerState,
        isLoading: false,
      });
      await get().refreshLearnerAndSchedule();
    } catch (error) {
      set({ error: 'Failed to load data', isLoading: false });
    }
  },

  setBabyProfile: async (profile: BabyProfile) => {
    try {
      await saveBabyProfile(profile);
      set({ babyProfile: profile });
      try {
        await get().refreshLearnerAndSchedule();
      } catch (refreshError) {
        console.error('Failed to refresh schedule:', refreshError);
      }
    } catch (error) {
      set({ error: 'Failed to save profile' });
      throw error;
    }
  },

  addSleepSession: async (sessionData) => {
    try {
      const session: SleepSession = {
        ...sessionData,
        id: uuidv4(),
        updatedAtISO: nowISO(),
      };
      await saveSleepSession(session);
      const sessions = [...get().sleepSessions, session];
      set({ sleepSessions: sessions });
      await get().refreshLearnerAndSchedule();
    } catch (error) {
      set({ error: 'Failed to save session' });
    }
  },

  updateSleepSession: async (session: SleepSession) => {
    try {
      const updated: SleepSession = {
        ...session,
        updatedAtISO: nowISO(),
      };
      await saveSleepSession(updated);
      const sessions = get().sleepSessions.map((s) => (s.id === session.id ? updated : s));
      set({ sleepSessions: sessions });
      await get().refreshLearnerAndSchedule();
    } catch (error) {
      set({ error: 'Failed to update session' });
    }
  },

  deleteSleepSession: async (sessionId: string) => {
    try {
      await deleteSessionStorage(sessionId);
      const sessions = get().sleepSessions.filter((s) => s.id !== sessionId);
      set({ sleepSessions: sessions });
      await get().refreshLearnerAndSchedule();
    } catch (error) {
      set({ error: 'Failed to delete session' });
    }
  },

  startTimer: () => {
    set({ activeTimerStart: nowISO() });
  },

  stopTimer: async () => {
    const { activeTimerStart } = get();
    if (!activeTimerStart) return;

    try {
      await get().addSleepSession({
        startISO: activeTimerStart,
        endISO: nowISO(),
        source: 'timer',
      });
      set({ activeTimerStart: null });
    } catch (error) {
      set({ error: 'Failed to save timer session' });
    }
  },

  cancelTimer: () => {
    set({ activeTimerStart: null });
  },

  setWakeWindowAdjustment: (minutes: number) => {
    set({ wakeWindowAdjustment: minutes });
    get().refreshLearnerAndSchedule();
  },

  resetData: async () => {
    try {
      await resetStorage();
      await cancelAllNotifications();
      set({
        babyProfile: null,
        sleepSessions: [],
        learnerState: null,
        scheduleBlocks: [],
        coachTips: [],
        activeTimerStart: null,
        wakeWindowAdjustment: 0,
      });
    } catch (error) {
      set({ error: 'Failed to reset data' });
    }
  },

  refreshLearnerAndSchedule: async () => {
    const { babyProfile, sleepSessions, wakeWindowAdjustment } = get();
    if (!babyProfile) {
      set({ learnerState: null, scheduleBlocks: [], coachTips: [] });
      return;
    }

    try {
      const learner = updateLearner(sleepSessions, babyProfile.birthDateISO, get().learnerState);
      await saveLearnerState(learner);
      set({ learnerState: learner });

      let schedule: ScheduleBlock[];
      if (wakeWindowAdjustment !== 0) {
        schedule = generateScheduleWithAdjustment(
          sleepSessions,
          learner,
          babyProfile.birthDateISO,
          wakeWindowAdjustment
        );
      } else {
        schedule = generateSchedule(sleepSessions, learner, babyProfile.birthDateISO);
      }
      set({ scheduleBlocks: schedule });

      const tips = analyzeAndGenerateTips(sleepSessions, learner, babyProfile.birthDateISO);
      set({ coachTips: tips });

      await scheduleBlockNotifications(schedule);
    } catch (error) {
      set({ error: 'Failed to refresh learner and schedule' });
    }
  },
}));
