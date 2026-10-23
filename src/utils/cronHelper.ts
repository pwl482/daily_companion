import { RecurrenceFrequency } from '../types';

export function formatFrequencyLabel(freq: RecurrenceFrequency, dayOfMonth?: number, dayOfWeek?: number, cronExpr?: string): string {
  switch (freq) {
    case 'monthly':
      return `Monthly (Day ${dayOfMonth ?? 1})`;
    case 'weekly': {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return `Weekly on ${days[dayOfWeek ?? 1] ?? 'Mon'}`;
    }
    case 'bi-weekly':
      return `Every 2 weeks`;
    case 'yearly':
      return `Yearly`;
    case 'custom_cron':
      return cronExpr ? `Cron: ${cronExpr}` : 'Custom Cron';
    default:
      return freq;
  }
}

/**
 * Basic cron matcher for standard 5-part cron: "minute hour day-of-month month day-of-week"
 * E.g. "0 0 1 * *" -> 1st of every month
 * E.g. "0 0 * * 1" -> Every Monday (0=Sun, 1=Mon... 6=Sat)
 * E.g. "0 0 15 * *" -> 15th of every month
 */
export function matchesCron(date: Date, cronExpr: string): boolean {
  try {
    const parts = cronExpr.trim().split(/\s+/);
    if (parts.length < 5) return false;

    const [, , domPart, monPart, dowPart] = parts;
    const dom = date.getDate();
    const mon = date.getMonth() + 1; // 1-12
    const dow = date.getDay(); // 0-6

    const checkPart = (part: string, val: number): boolean => {
      if (part === '*') return true;
      if (part.includes(',')) {
        return part.split(',').some(p => parseInt(p, 10) === val);
      }
      if (part.includes('/')) {
        const [, step] = part.split('/');
        return val % parseInt(step, 10) === 0;
      }
      return parseInt(part, 10) === val;
    };

    return checkPart(domPart, dom) && checkPart(monPart, mon) && checkPart(dowPart, dow);
  } catch {
    return false;
  }
}

/**
 * Checks if a recurring sub-entry triggers on a given date (ignoring time)
 */
export function isRecurringActiveOnDate(
  dateStr: string,
  startDateStr: string,
  endDateStr?: string | null,
  frequency: RecurrenceFrequency = 'monthly',
  dayOfMonth = 1,
  dayOfWeek = 1,
  cronExpr?: string
): boolean {
  if (dateStr < startDateStr) return false;
  if (endDateStr && dateStr > endDateStr) return false;

  const targetDate = new Date(dateStr + 'T12:00:00');
  const startDate = new Date(startDateStr + 'T12:00:00');

  if (frequency === 'monthly') {
    // Check if target day of month equals target day, or last day of month if target day > days in month
    const maxDay = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
    const effectiveDay = Math.min(dayOfMonth, maxDay);
    return targetDate.getDate() === effectiveDay;
  }

  if (frequency === 'weekly') {
    return targetDate.getDay() === dayOfWeek;
  }

  if (frequency === 'bi-weekly') {
    const diffTime = targetDate.getTime() - startDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
    return diffDays >= 0 && diffDays % 14 === 0;
  }

  if (frequency === 'yearly') {
    return targetDate.getMonth() === startDate.getMonth() && targetDate.getDate() === startDate.getDate();
  }

  if (frequency === 'custom_cron' && cronExpr) {
    return matchesCron(targetDate, cronExpr);
  }

  return false;
}
