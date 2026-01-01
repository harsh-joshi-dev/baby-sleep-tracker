import { SleepSession, LearnerState } from '../types';
import { getAgeBaseline, getAgeInMonths } from '../utils/ageBaseline';
import { minutesBetween, nowISO, isBefore } from '../utils/timeUtils';
import { CURRENT_SCHEMA_VERSION } from '../types/storage';

const EWMA_ALPHA = 0.3;
const MIN_SESSIONS_FOR_CONFIDENCE = 5;
const CONFIDENCE_DECAY_DAYS = 7;

function isNightSleep(startISO: string, endISO: string): boolean {
  const startHour = new Date(startISO).getHours();
  const endHour = new Date(endISO).getHours();
  const durationMinutes = minutesBetween(startISO, endISO);
  return durationMinutes > 360 || (startHour >= 18 || startHour < 6) || (endHour >= 18 || endHour < 6);
}

function isNap(startISO: string, endISO: string): boolean {
  return !isNightSleep(startISO, endISO);
}

function calculateEWMA(
  currentValue: number,
  newValue: number,
  alpha: number = EWMA_ALPHA
): number {
  return alpha * newValue + (1 - alpha) * currentValue;
}

function calculateConfidence(
  sessionCount: number,
  variance: number,
  lastUpdatedISO: string
): number {
  let baseConfidence = Math.min(1.0, sessionCount / (MIN_SESSIONS_FOR_CONFIDENCE * 2));
  const daysSinceUpdate = minutesBetween(lastUpdatedISO, nowISO()) / (24 * 60);
  const recencyFactor = Math.max(0, 1 - daysSinceUpdate / CONFIDENCE_DECAY_DAYS);
  const variancePenalty = Math.max(0.3, 1 - Math.min(1, variance / 100));
  return Math.min(1.0, baseConfidence * recencyFactor * variancePenalty);
}

export function updateLearner(
  sessions: SleepSession[],
  birthDateISO: string,
  currentState: LearnerState | null
): LearnerState {
  const validSessions = sessions.filter((s) => !s.deleted && s.startISO < s.endISO);
  const ageBaseline = getAgeBaseline(birthDateISO);
  const now = nowISO();

  if (validSessions.length === 0) {
    return {
      version: CURRENT_SCHEMA_VERSION,
      ewmaNapLengthMin: ageBaseline.typicalNapLengthMin,
      ewmaWakeWindowMin: ageBaseline.typicalWakeWindowMin,
      lastUpdatedISO: now,
      confidence: 0.1,
    };
  }

  const sortedSessions = [...validSessions].sort((a, b) =>
    isBefore(a.startISO, b.startISO) ? -1 : 1
  );

  let napLengths: number[] = [];
  let wakeWindows: number[] = [];

  for (let i = 0; i < sortedSessions.length; i++) {
    const session = sortedSessions[i];
    const duration = minutesBetween(session.startISO, session.endISO);

    if (isNap(session.startISO, session.endISO) && duration >= 15) {
      napLengths.push(duration);
    }

    if (i > 0) {
      const prevEnd = sortedSessions[i - 1].endISO;
      const currStart = session.startISO;
      const wakeWindow = minutesBetween(prevEnd, currStart);
      if (wakeWindow > 0 && wakeWindow < 600) {
        wakeWindows.push(wakeWindow);
      }
    }
  }

  let ewmaNapLength = ageBaseline.typicalNapLengthMin;
  let ewmaWakeWindow = ageBaseline.typicalWakeWindowMin;

  if (currentState) {
    ewmaNapLength = currentState.ewmaNapLengthMin;
    ewmaWakeWindow = currentState.ewmaWakeWindowMin;
  }

  if (napLengths.length > 0) {
    const avgNapLength = napLengths.reduce((sum, n) => sum + n, 0) / napLengths.length;
    ewmaNapLength = calculateEWMA(ewmaNapLength, avgNapLength);
    ewmaNapLength = Math.max(
      ageBaseline.minWakeWindowMin * 0.5,
      Math.min(ageBaseline.maxWakeWindowMin * 2, ewmaNapLength)
    );
  }

  if (wakeWindows.length > 0) {
    const avgWakeWindow = wakeWindows.reduce((sum, w) => sum + w, 0) / wakeWindows.length;
    ewmaWakeWindow = calculateEWMA(ewmaWakeWindow, avgWakeWindow);
    ewmaWakeWindow = Math.max(
      ageBaseline.minWakeWindowMin,
      Math.min(ageBaseline.maxWakeWindowMin, ewmaWakeWindow)
    );
  }

  const napVariance =
    napLengths.length > 1
      ? napLengths.reduce((sum, n) => sum + Math.pow(n - ewmaNapLength, 2), 0) / napLengths.length
      : 0;
  const wakeVariance =
    wakeWindows.length > 1
      ? wakeWindows.reduce((sum, w) => sum + Math.pow(w - ewmaWakeWindow, 2), 0) /
        wakeWindows.length
      : 0;
  const avgVariance = (napVariance + wakeVariance) / 2;

  const confidence = calculateConfidence(
    validSessions.length,
    avgVariance,
    currentState?.lastUpdatedISO || now
  );

  return {
    version: CURRENT_SCHEMA_VERSION,
    ewmaNapLengthMin: Math.round(ewmaNapLength),
    ewmaWakeWindowMin: Math.round(ewmaWakeWindow),
    lastUpdatedISO: now,
    confidence: Math.round(confidence * 100) / 100,
  };
}
