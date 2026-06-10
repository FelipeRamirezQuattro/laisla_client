import { format, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { es } from 'date-fns/locale';

const TIMEZONE = 'America/Bogota';

export function formatDate(dateStr: string, fmt = 'd MMMM yyyy'): string {
  try {
    const dateOnlyMatch = typeof dateStr === 'string'
      ? dateStr.match(/^(\d{4}-\d{2}-\d{2})(?:T00:00:00(?:\.000)?(?:Z|\+00:00))?$/)
      : null;
    if (dateOnlyMatch) {
      const [year, month, day] = dateOnlyMatch[1].split('-').map(Number);
      return format(new Date(year, month - 1, day), fmt, { locale: es });
    }
    const parsed = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
    const date = toZonedTime(parsed, TIMEZONE);
    return format(date, fmt, { locale: es });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string): string {
  return formatDate(dateStr, "d 'de' MMMM yyyy, h:mm a");
}

export function formatShortDate(dateStr: string): string {
  return formatDate(dateStr, 'dd/MM/yyyy');
}

/** Returns today's date as YYYY-MM-DD in Colombia, independent of browser timezone. */
export function todayLocal(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
}

export function formatTime(timeStr: string): string {
  if (!timeStr.includes(':')) return timeStr;
  // timeStr is like "19:30"
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'p.m.' : 'a.m.';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
}

export { TIMEZONE };
