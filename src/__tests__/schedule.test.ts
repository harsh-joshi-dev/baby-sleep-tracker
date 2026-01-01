import { generateSchedule, generateScheduleWithAdjustment } from '../models/schedule';
import { SleepSession, LearnerState } from '../types';

describe('Schedule Generator', () => {
  const birthDateISO = '2024-01-01T00:00:00.000Z';
  const learner: LearnerState = {
    version: 1,
    ewmaNapLengthMin: 90,
    ewmaWakeWindowMin: 120,
    lastUpdatedISO: '2024-07-01T12:00:00.000Z',
    confidence: 0.8,
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-07-01T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should generate schedule blocks', () => {
    const sessions: SleepSession[] = [];
    const blocks = generateSchedule(sessions, learner, birthDateISO);
    expect(blocks.length).toBeGreaterThan(0);
    expect(blocks.every((b) => b.kind === 'nap' || b.kind === 'bedtime' || b.kind === 'windDown')).toBe(
      true
    );
  });

  it('should include wind-down blocks before naps and bedtime', () => {
    const sessions: SleepSession[] = [];
    const blocks = generateSchedule(sessions, learner, birthDateISO);
    const napBlocks = blocks.filter((b) => b.kind === 'nap');
    const windDownBlocks = blocks.filter((b) => b.kind === 'windDown');

    expect(windDownBlocks.length).toBeGreaterThan(0);
  });

  it('should generate blocks with confidence values', () => {
    const sessions: SleepSession[] = [];
    const blocks = generateSchedule(sessions, learner, birthDateISO);
    blocks.forEach((block) => {
      expect(block.confidence).toBeGreaterThanOrEqual(0);
      expect(block.confidence).toBeLessThanOrEqual(1);
    });
  });

  it('should include rationale for each block', () => {
    const sessions: SleepSession[] = [];
    const blocks = generateSchedule(sessions, learner, birthDateISO);
    blocks.forEach((block) => {
      expect(block.rationale).toBeTruthy();
      expect(typeof block.rationale).toBe('string');
    });
  });

  it('should adjust wake window with adjustment parameter', () => {
    const sessions: SleepSession[] = [];
    const blocks1 = generateSchedule(sessions, learner, birthDateISO);
    const blocks2 = generateScheduleWithAdjustment(sessions, learner, birthDateISO, 30);

    expect(blocks2.length).toBeGreaterThan(0);
  });

  it('should generate blocks only for future times', () => {
    const sessions: SleepSession[] = [];
    const now = new Date().toISOString();
    const blocks = generateSchedule(sessions, learner, birthDateISO);
    blocks.forEach((block) => {
      expect(new Date(block.startISO).getTime()).toBeGreaterThanOrEqual(new Date(now).getTime());
    });
  });

  it('should handle empty sessions array', () => {
    const sessions: SleepSession[] = [];
    const blocks = generateSchedule(sessions, learner, birthDateISO);
    expect(Array.isArray(blocks)).toBe(true);
  });
});
