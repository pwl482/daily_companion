import { UnavailableInterval } from '../types';

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date + (date.length === 10 ? 'T00:00:00' : '')) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatMonthYear(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date + (date.length === 10 ? 'T00:00:00' : '')) : date;
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function getTodayDateString(): string {
  return formatDate(new Date());
}

export function getWeekdayName(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

export function isDateWithinInterval(targetDate: string, startDate: string, endDate: string): boolean {
  return targetDate >= startDate && targetDate <= endDate;
}

/**
 * Checks if a person's unavailable intervals clash with a given date range
 */
export function findConflictingInterval(
  targetDate: string,
  intervals: UnavailableInterval[]
): UnavailableInterval | null {
  for (const interval of intervals) {
    if (isDateWithinInterval(targetDate, interval.startDate, interval.endDate)) {
      return interval;
    }
  }
  return null;
}

/**
 * Get days of a month as string array YYYY-MM-DD
 */
export function getDaysInMonth(year: number, monthZeroIndexed: number): string[] {
  const days: string[] = [];
  const date = new Date(year, monthZeroIndexed, 1);
  while (date.getMonth() === monthZeroIndexed) {
    days.push(formatDate(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

/**
 * Generates an array of past N months strings: ['2026-05', '2026-06', ...]
 */
export function getRecentMonthsList(count: number = 6): string[] {
  const result: string[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    result.push(`${y}-${m}`);
  }
  return result;
}
