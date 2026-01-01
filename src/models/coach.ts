import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { CoachTip, SleepSession, LearnerState } from '../types';
import { getAgeBaseline } from '../utils/ageBaseline';
import { minutesBetween, nowISO, isBefore, isAfter, getStartOfDay, getDaysDifference } from '../utils/timeUtils';

const SHORT_NAP_THRESHOLD_MIN = 30;
const LONG_WAKE_WINDOW_THRESHOLD_PCT = 1.2;
const BEDTIME_SHIFT_THRESHOLD_MIN = 30;
const SPLIT_NIGHT_THRESHOLD_HOURS = 3;

function isNap(startISO: string, endISO: string): boolean {
  const startHour = new Date(startISO).getHours();
  const durationMinutes = minutesBetween(startISO, endISO);
  return durationMinutes < 360 && startHour >= 6 && startHour < 18;
}

function isNightSleep(startISO: string, endISO: string): boolean {
  return !isNap(startISO, endISO);
}

export function analyzeAndGenerateTips(
  sessions: SleepSession[],
  learner: LearnerState,
  birthDateISO: string
): CoachTip[] {
  const tips: CoachTip[] = [];
  const validSessions = sessions
    .filter((s) => !s.deleted && isBefore(s.startISO, s.endISO))
    .sort((a, b) => (isBefore(a.startISO, b.startISO) ? -1 : 1));

  if (validSessions.length === 0) {
    return tips;
  }

  const baseline = getAgeBaseline(birthDateISO);
  const now = nowISO();
  const recentDays = 7;
  const cutoffDate = new Date(now);
  cutoffDate.setDate(cutoffDate.getDate() - recentDays);
  const cutoffISO = cutoffDate.toISOString();

  const recentSessions = validSessions.filter((s) => isAfter(s.startISO, cutoffISO));

  const shortNapStreak = detectShortNapStreak(recentSessions, baseline);
  if (shortNapStreak) {
    tips.push({
      id: uuidv4(),
      type: 'shortNapStreak',
      severity: 'warning',
      title: 'Short Nap Pattern',
      message: `Multiple short naps detected (${shortNapStreak.count} naps under ${SHORT_NAP_THRESHOLD_MIN} minutes).`,
      rationale: `Recent naps are shorter than typical. Consider adjusting wake windows or environment.`,
      relatedSessionIds: shortNapStreak.sessionIds,
      createdAtISO: now,
    });
  }

  const longWakeWindow = detectLongWakeWindow(recentSessions, learner, baseline);
  if (longWakeWindow) {
    tips.push({
      id: uuidv4(),
      type: 'longWakeWindow',
      severity: 'warning',
      title: 'Extended Wake Window',
      message: `Wake window of ${longWakeWindow.minutes} minutes detected (target: ${Math.round(learner.ewmaWakeWindowMin)} minutes).`,
      rationale: `Extended wake windows can lead to overtiredness. Consider earlier wind-down.`,
      relatedSessionIds: longWakeWindow.sessionIds,
      createdAtISO: now,
    });
  }

  const bedtimeShift = detectBedtimeShift(validSessions, baseline);
  if (bedtimeShift) {
    tips.push({
      id: uuidv4(),
      type: 'bedtimeShift',
      severity: 'info',
      title: 'Bedtime Shift Detected',
      message: `Bedtime has shifted ${bedtimeShift.direction === 'earlier' ? 'earlier' : 'later'} by ${bedtimeShift.minutes} minutes.`,
      rationale: `Bedtime patterns are shifting. Monitor for consistency.`,
      relatedSessionIds: bedtimeShift.sessionIds,
      createdAtISO: now,
    });
  }

  const splitNight = detectSplitNight(recentSessions);
  if (splitNight) {
    tips.push({
      id: uuidv4(),
      type: 'splitNight',
      severity: 'warning',
      title: 'Split Night Detected',
      message: 'Extended wake period detected during night sleep.',
      rationale: `Long wake periods during the night may indicate schedule adjustments needed.`,
      relatedSessionIds: splitNight.sessionIds,
      createdAtISO: now,
    });
  }

  return tips;
}

function detectShortNapStreak(
  sessions: SleepSession[],
  baseline: ReturnType<typeof getAgeBaseline>
): { count: number; sessionIds: string[] } | null {
  const naps = sessions.filter((s) => isNap(s.startISO, s.endISO));
  const shortNaps = naps.filter(
    (s) => minutesBetween(s.startISO, s.endISO) < SHORT_NAP_THRESHOLD_MIN
  );

  if (shortNaps.length >= 3) {
    return {
      count: shortNaps.length,
      sessionIds: shortNaps.slice(-5).map((s) => s.id),
    };
  }

  return null;
}

function detectLongWakeWindow(
  sessions: SleepSession[],
  learner: LearnerState,
  baseline: ReturnType<typeof getAgeBaseline>
): { minutes: number; sessionIds: string[] } | null {
  if (sessions.length < 2) return null;

  const targetWakeWindow = learner.ewmaWakeWindowMin;
  const threshold = targetWakeWindow * LONG_WAKE_WINDOW_THRESHOLD_PCT;

  for (let i = 1; i < sessions.length; i++) {
    const prevEnd = sessions[i - 1].endISO;
    const currStart = sessions[i].startISO;
    const wakeWindow = minutesBetween(prevEnd, currStart);

    if (wakeWindow > threshold && wakeWindow < 600) {
      return {
        minutes: wakeWindow,
        sessionIds: [sessions[i - 1].id, sessions[i].id],
      };
    }
  }

  return null;
}

function detectBedtimeShift(
  sessions: SleepSession[],
  baseline: ReturnType<typeof getAgeBaseline>
): { direction: 'earlier' | 'later'; minutes: number; sessionIds: string[] } | null {
  const nightSessions = sessions.filter((s) => isNightSleep(s.startISO, s.endISO));
  if (nightSessions.length < 5) return null;

  const recentBedtimes = nightSessions.slice(-5).map((s) => new Date(s.startISO).getHours() * 60 + new Date(s.startISO).getMinutes());
  const olderBedtimes = nightSessions.slice(-10, -5).map((s) => new Date(s.startISO).getHours() * 60 + new Date(s.startISO).getMinutes());

  if (olderBedtimes.length === 0) return null;

  const recentAvg = recentBedtimes.reduce((sum, t) => sum + t, 0) / recentBedtimes.length;
  const olderAvg = olderBedtimes.reduce((sum, t) => sum + t, 0) / olderBedtimes.length;
  const shift = recentAvg - olderAvg;

  if (Math.abs(shift) > BEDTIME_SHIFT_THRESHOLD_MIN) {
    return {
      direction: shift > 0 ? 'later' : 'earlier',
      minutes: Math.abs(shift),
      sessionIds: nightSessions.slice(-5).map((s) => s.id),
    };
  }

  return null;
}

function detectSplitNight(sessions: SleepSession[]): { sessionIds: string[] } | null {
  for (const session of sessions) {
    if (isNightSleep(session.startISO, session.endISO)) {
      const durationHours = minutesBetween(session.startISO, session.endISO) / 60;
      if (durationHours > 12) {
        const midPoint = new Date(session.startISO);
        midPoint.setHours(midPoint.getHours() + durationHours / 2);

        const overlappingSessions = sessions.filter((s) => {
          if (s.id === session.id || s.deleted) return false;
          const sStart = new Date(s.startISO);
          const sEnd = new Date(s.endISO);
          return sStart < midPoint && sEnd > midPoint;
        });

        if (overlappingSessions.length > 0) {
          const gapStart = new Date(session.startISO);
          gapStart.setHours(gapStart.getHours() + 4);
          const gapEnd = new Date(session.endISO);
          gapEnd.setHours(gapEnd.getHours() - 4);

          const wakePeriod = minutesBetween(gapStart.toISOString(), gapEnd.toISOString()) / 60;
          if (wakePeriod > SPLIT_NIGHT_THRESHOLD_HOURS) {
            return {
              sessionIds: [session.id, ...overlappingSessions.map((s) => s.id)],
            };
          }
        }
      }
    }
  }

  return null;
}
