import {
  parseISO,
  formatTime,
  formatDate,
  getStartOfDay,
  minutesBetween,
  addMinutes,
  isSameDay,
  isToday,
  isBefore,
  isAfter,
  nowISO,
} from '../utils/timeUtils';
import dayjs from 'dayjs';

describe('Time Utils', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-07-01T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('parseISO', () => {
    it('should parse ISO string correctly', () => {
      const result = parseISO('2024-07-01T12:00:00.000Z');
      expect(result.isValid()).toBe(true);
    });
  });

  describe('formatTime', () => {
    it('should format time correctly', () => {
      const result = formatTime('2024-07-01T14:30:00.000Z');
      expect(result).toMatch(/\d{1,2}:\d{2} (AM|PM)/);
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const result = formatDate('2024-07-01T12:00:00.000Z');
      expect(result).toMatch(/Jul \d{1,2}, 2024/);
    });
  });

  describe('getStartOfDay', () => {
    it('should return start of day', () => {
      const result = getStartOfDay('2024-07-01T14:30:00.000Z');
      const date = new Date(result);
      expect(date.getHours()).toBe(0);
      expect(date.getMinutes()).toBe(0);
      expect(date.getSeconds()).toBe(0);
    });

    it('should use current time if no argument provided', () => {
      const result = getStartOfDay();
      const date = new Date(result);
      expect(date.getHours()).toBe(0);
    });
  });

  describe('minutesBetween', () => {
    it('should calculate minutes between two dates', () => {
      const result = minutesBetween('2024-07-01T12:00:00.000Z', '2024-07-01T13:30:00.000Z');
      expect(result).toBe(90);
    });

    it('should handle negative differences', () => {
      const result = minutesBetween('2024-07-01T13:30:00.000Z', '2024-07-01T12:00:00.000Z');
      expect(result).toBe(-90);
    });
  });

  describe('addMinutes', () => {
    it('should add minutes correctly', () => {
      const result = addMinutes('2024-07-01T12:00:00.000Z', 30);
      const date = new Date(result);
      expect(date.getMinutes()).toBe(30);
    });

    it('should handle negative minutes', () => {
      const result = addMinutes('2024-07-01T12:30:00.000Z', -30);
      const date = new Date(result);
      expect(date.getMinutes()).toBe(0);
    });
  });

  describe('isSameDay', () => {
    it('should return true for same day', () => {
      const result = isSameDay('2024-07-01T12:00:00.000Z', '2024-07-01T18:00:00.000Z');
      expect(result).toBe(true);
    });

    it('should return false for different days', () => {
      const result = isSameDay('2024-07-01T12:00:00.000Z', '2024-07-02T12:00:00.000Z');
      expect(result).toBe(false);
    });
  });

  describe('isToday', () => {
    it('should return true for today', () => {
      const today = nowISO();
      const result = isToday(today);
      expect(result).toBe(true);
    });

    it('should return false for yesterday', () => {
      const yesterday = addMinutes(nowISO(), -24 * 60);
      const result = isToday(yesterday);
      expect(result).toBe(false);
    });
  });

  describe('isBefore', () => {
    it('should return true if first date is before second', () => {
      const result = isBefore('2024-07-01T12:00:00.000Z', '2024-07-01T13:00:00.000Z');
      expect(result).toBe(true);
    });

    it('should return false if first date is after second', () => {
      const result = isBefore('2024-07-01T13:00:00.000Z', '2024-07-01T12:00:00.000Z');
      expect(result).toBe(false);
    });
  });

  describe('isAfter', () => {
    it('should return true if first date is after second', () => {
      const result = isAfter('2024-07-01T13:00:00.000Z', '2024-07-01T12:00:00.000Z');
      expect(result).toBe(true);
    });

    it('should return false if first date is before second', () => {
      const result = isAfter('2024-07-01T12:00:00.000Z', '2024-07-01T13:00:00.000Z');
      expect(result).toBe(false);
    });
  });

  describe('DST handling', () => {
    it('should handle DST transitions correctly', () => {
      const beforeDST = '2024-03-10T06:00:00.000Z';
      const afterDST = '2024-03-10T07:00:00.000Z';
      const minutes = minutesBetween(beforeDST, afterDST);
      expect(typeof minutes).toBe('number');
      expect(Math.abs(minutes)).toBeLessThanOrEqual(120);
    });

    it('should maintain consistent time calculations across DST', () => {
      const date1 = '2024-03-09T12:00:00.000Z';
      const date2 = addMinutes(date1, 60);
      const diff = minutesBetween(date1, date2);
      expect(Math.abs(diff)).toBe(60);
    });
  });
});
