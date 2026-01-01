import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { ScheduleBlock, SleepSession, LearnerState } from '../types';
import { getAgeBaseline } from '../utils/ageBaseline';
import {
  nowISO,
  addMinutes,
  minutesBetween,
  getStartOfDay,
  isBefore,
  isAfter,
  formatTime,
} from '../utils/timeUtils';

const WIND_DOWN_BUFFER_MIN = 30;
const MAX_NAPS_PER_DAY = 4;
const BEDTIME_TARGET_HOUR = 19;

function isNightSleep(startISO: string, endISO: string): boolean {
  const startHour = new Date(startISO).getHours();
  const endHour = new Date(endISO).getHours();
  const durationMinutes = minutesBetween(startISO, endISO);
  return durationMinutes > 360 || (startHour >= 18 || startHour < 6) || (endHour >= 18 || endHour < 6);
}

function getLastSessionEnd(sessions: SleepSession[], beforeISO: string): string | null {
  const validSessions = sessions
    .filter((s) => !s.deleted && isBefore(s.endISO, beforeISO))
    .sort((a, b) => (isBefore(a.endISO, b.endISO) ? 1 : -1));
  return validSessions.length > 0 ? validSessions[0].endISO : null;
}

function generateNapBlock(
  startISO: string,
  learner: LearnerState,
  baseline: ReturnType<typeof getAgeBaseline>,
  confidence: number
): ScheduleBlock {
  const napLength = learner.ewmaNapLengthMin;
  const endISO = addMinutes(startISO, napLength);
  return {
    id: uuidv4(),
    kind: 'nap',
    startISO,
    endISO,
    confidence,
    rationale: `Nap: EWMA ${napLength}m (baseline ${baseline.typicalNapLengthMin}m)`,
  };
}

function generateWindDownBlock(
  startISO: string,
  targetISO: string,
  confidence: number
): ScheduleBlock {
  return {
    id: uuidv4(),
    kind: 'windDown',
    startISO,
    endISO: targetISO,
    confidence,
    rationale: `Wind down period before ${formatTime(targetISO)}`,
  };
}

function generateBedtimeBlock(
  startISO: string,
  confidence: number
): ScheduleBlock {
  const endISO = addMinutes(startISO, 12 * 60);
  return {
    id: uuidv4(),
    kind: 'bedtime',
    startISO,
    endISO,
    confidence,
    rationale: `Bedtime at ${formatTime(startISO)}`,
  };
}

export function generateSchedule(
  sessions: SleepSession[],
  learner: LearnerState,
  birthDateISO: string,
  startFromISO: string = nowISO(),
  daysAhead: number = 2
): ScheduleBlock[] {
  const blocks: ScheduleBlock[] = [];
  const baseline = getAgeBaseline(birthDateISO);
  const startDate = new Date(startFromISO);
  const endDate = new Date(startFromISO);
  endDate.setDate(endDate.getDate() + daysAhead);

  let currentISO = startFromISO;

  for (let dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
    const dayStart = new Date(startDate);
    dayStart.setDate(dayStart.getDate() + dayOffset);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const dayStartISO = dayStart.toISOString();
    const dayEndISO = dayEnd.toISOString();

    if (dayOffset === 0 && isBefore(currentISO, dayStartISO)) {
      currentISO = dayStartISO;
    }

    const daySessions = sessions.filter(
      (s) =>
        !s.deleted &&
        ((isAfter(s.startISO, dayStartISO) && isBefore(s.startISO, dayEndISO)) ||
          (isBefore(s.startISO, dayStartISO) && isAfter(s.endISO, dayStartISO)))
    );

    const lastEndBeforeDay = getLastSessionEnd(sessions, dayStartISO);
    if (lastEndBeforeDay && isAfter(lastEndBeforeDay, currentISO)) {
      currentISO = lastEndBeforeDay;
    }

    let napCount = 0;
    const targetBedtime = new Date(dayStart);
    targetBedtime.setHours(BEDTIME_TARGET_HOUR, 0, 0, 0);
    const targetBedtimeISO = targetBedtime.toISOString();

    while (isBefore(currentISO, dayEndISO) && napCount < MAX_NAPS_PER_DAY) {
      if (isBefore(addMinutes(currentISO, learner.ewmaWakeWindowMin + learner.ewmaNapLengthMin), targetBedtimeISO)) {
        const wakeWindow = learner.ewmaWakeWindowMin;
        const napStartISO = addMinutes(currentISO, wakeWindow);

        if (isBefore(napStartISO, targetBedtimeISO)) {
          const windDownStartISO = addMinutes(napStartISO, -WIND_DOWN_BUFFER_MIN);
          if (isAfter(windDownStartISO, currentISO)) {
            blocks.push(generateWindDownBlock(windDownStartISO, napStartISO, learner.confidence));
          }

          const napBlock = generateNapBlock(napStartISO, learner, baseline, learner.confidence);
          blocks.push(napBlock);
          currentISO = napBlock.endISO;
          napCount++;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    if (isBefore(currentISO, targetBedtimeISO)) {
      const bedtimeISO = targetBedtimeISO;
      const windDownStartISO = addMinutes(bedtimeISO, -WIND_DOWN_BUFFER_MIN);
      if (isAfter(windDownStartISO, currentISO)) {
        blocks.push(generateWindDownBlock(windDownStartISO, bedtimeISO, learner.confidence));
      }
      blocks.push(generateBedtimeBlock(bedtimeISO, learner.confidence));
      currentISO = addMinutes(bedtimeISO, 12 * 60);
    }
  }

  return blocks.filter((block) => isAfter(block.startISO, startFromISO));
}

export function generateScheduleWithAdjustment(
  sessions: SleepSession[],
  learner: LearnerState,
  birthDateISO: string,
  wakeWindowAdjustmentMinutes: number,
  startFromISO: string = nowISO()
): ScheduleBlock[] {
  const adjustedLearner: LearnerState = {
    ...learner,
    ewmaWakeWindowMin: Math.max(30, learner.ewmaWakeWindowMin + wakeWindowAdjustmentMinutes),
  };
  return generateSchedule(sessions, adjustedLearner, birthDateISO, startFromISO, 2);
}
