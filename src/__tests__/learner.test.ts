import { updateLearner } from '../models/learner';
import { SleepSession, LearnerState } from '../types';
import { CURRENT_SCHEMA_VERSION } from '../types/storage';

describe('Learner', () => {
  const birthDateISO = '2024-01-01T00:00:00.000Z';

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-07-01T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with baseline values when no sessions exist', () => {
    const learner = updateLearner([], birthDateISO, null);
    expect(learner.version).toBe(CURRENT_SCHEMA_VERSION);
    expect(learner.ewmaWakeWindowMin).toBeGreaterThan(0);
    expect(learner.ewmaNapLengthMin).toBeGreaterThan(0);
    expect(learner.confidence).toBe(0.1);
  });

  it('should calculate EWMA for nap length', () => {
    const sessions: SleepSession[] = [
      {
        id: '1',
        startISO: '2024-07-01T09:00:00.000Z',
        endISO: '2024-07-01T10:30:00.000Z',
        source: 'manual',
        updatedAtISO: '2024-07-01T10:30:00.000Z',
      },
      {
        id: '2',
        startISO: '2024-07-01T13:00:00.000Z',
        endISO: '2024-07-01T14:00:00.000Z',
        source: 'manual',
        updatedAtISO: '2024-07-01T14:00:00.000Z',
      },
    ];

    const learner = updateLearner(sessions, birthDateISO, null);
    expect(learner.ewmaNapLengthMin).toBeGreaterThan(0);
    expect(learner.confidence).toBeGreaterThan(0.1);
  });

  it('should calculate wake windows between sessions', () => {
    const sessions: SleepSession[] = [
      {
        id: '1',
        startISO: '2024-07-01T09:00:00.000Z',
        endISO: '2024-07-01T10:30:00.000Z',
        source: 'manual',
        updatedAtISO: '2024-07-01T10:30:00.000Z',
      },
      {
        id: '2',
        startISO: '2024-07-01T13:00:00.000Z',
        endISO: '2024-07-01T14:00:00.000Z',
        source: 'manual',
        updatedAtISO: '2024-07-01T14:00:00.000Z',
      },
    ];

    const learner = updateLearner(sessions, birthDateISO, null);
    expect(learner.ewmaWakeWindowMin).toBeGreaterThan(0);
  });

  it('should update confidence with more sessions', () => {
    const sessions1: SleepSession[] = [
      {
        id: '1',
        startISO: '2024-07-01T09:00:00.000Z',
        endISO: '2024-07-01T10:30:00.000Z',
        source: 'manual',
        updatedAtISO: '2024-07-01T10:30:00.000Z',
      },
    ];

    const learner1 = updateLearner(sessions1, birthDateISO, null);
    const confidence1 = learner1.confidence;

    const sessions2 = [
      ...sessions1,
      {
        id: '2',
        startISO: '2024-07-01T13:00:00.000Z',
        endISO: '2024-07-01T14:00:00.000Z',
        source: 'manual',
        updatedAtISO: '2024-07-01T14:00:00.000Z',
      },
      {
        id: '3',
        startISO: '2024-07-01T16:00:00.000Z',
        endISO: '2024-07-01T17:00:00.000Z',
        source: 'manual',
        updatedAtISO: '2024-07-01T17:00:00.000Z',
      },
      {
        id: '4',
        startISO: '2024-07-01T20:00:00.000Z',
        endISO: '2024-07-02T06:00:00.000Z',
        source: 'manual',
        updatedAtISO: '2024-07-02T06:00:00.000Z',
      },
    ];

    const learner2 = updateLearner(sessions2, birthDateISO, learner1);
    expect(learner2.confidence).toBeGreaterThanOrEqual(confidence1);
  });

  it('should clamp wake windows to age baseline limits', () => {
    const sessions: SleepSession[] = [
      {
        id: '1',
        startISO: '2024-07-01T09:00:00.000Z',
        endISO: '2024-07-01T10:30:00.000Z',
        source: 'manual',
        updatedAtISO: '2024-07-01T10:30:00.000Z',
      },
    ];

    const learner = updateLearner(sessions, birthDateISO, null);
    expect(learner.ewmaWakeWindowMin).toBeGreaterThanOrEqual(30);
    expect(learner.ewmaWakeWindowMin).toBeLessThanOrEqual(600);
  });

  it('should ignore deleted sessions', () => {
    const sessions: SleepSession[] = [
      {
        id: '1',
        startISO: '2024-07-01T09:00:00.000Z',
        endISO: '2024-07-01T10:30:00.000Z',
        source: 'manual',
        deleted: true,
        updatedAtISO: '2024-07-01T10:30:00.000Z',
      },
    ];

    const learner = updateLearner(sessions, birthDateISO, null);
    expect(learner.confidence).toBe(0.1);
  });
});
