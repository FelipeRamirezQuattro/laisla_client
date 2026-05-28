import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const TIMEZONE = 'America/Bogota';

export function formatDate(dateStr: string, fmt = 'd MMMM yyyy'): string {
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
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

/** Returns today's date as YYYY-MM-DD in the browser's local timezone (Colombia). */
export function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
