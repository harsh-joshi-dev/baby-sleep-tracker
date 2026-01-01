import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import duration from 'dayjs/plugin/duration';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(duration);

export function parseISO(isoString: string): dayjs.Dayjs {
  return dayjs(isoString);
}

export function formatTime(isoString: string): string {
  return parseISO(isoString).format('h:mm A');
}

export function formatDate(isoString: string): string {
  return parseISO(isoString).format('MMM D, YYYY');
}

export function formatDateTime(isoString: string): string {
  return parseISO(isoString).format('MMM D, YYYY h:mm A');
}

export function getStartOfDay(isoString?: string): string {
  const date = isoString ? parseISO(isoString) : dayjs();
  return date.startOf('day').toISOString();
}

export function getEndOfDay(isoString?: string): string {
  const date = isoString ? parseISO(isoString) : dayjs();
  return date.endOf('day').toISOString();
}

export function getDaysDifference(startISO: string, endISO: string): number {
  const start = parseISO(startISO);
  const end = parseISO(endISO);
  return end.diff(start, 'day');
}

export function minutesBetween(startISO: string, endISO: string): number {
  const start = parseISO(startISO);
  const end = parseISO(endISO);
  return end.diff(start, 'minute');
}

export function addMinutes(isoString: string, minutes: number): string {
  return parseISO(isoString).add(minutes, 'minute').toISOString();
}

export function isSameDay(iso1: string, iso2: string): boolean {
  return parseISO(iso1).isSame(parseISO(iso2), 'day');
}

export function isToday(isoString: string): boolean {
  return parseISO(isoString).isSame(dayjs(), 'day');
}

export function isTomorrow(isoString: string): boolean {
  return parseISO(isoString).isSame(dayjs().add(1, 'day'), 'day');
}

export function isBefore(iso1: string, iso2: string): boolean {
  return parseISO(iso1).isBefore(parseISO(iso2));
}

export function isAfter(iso1: string, iso2: string): boolean {
  return parseISO(iso1).isAfter(parseISO(iso2));
}

export function nowISO(): string {
  return dayjs().toISOString();
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}
