import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatDate, formatDateTime, formatShortDate, formatTime, todayLocal } from './formatDate';

describe('date formatting', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-29T02:30:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps date-only values on the selected calendar day', () => {
    expect(formatShortDate('2026-09-28')).toBe('28/09/2026');
    expect(formatShortDate('2026-09-28T00:00:00.000Z')).toBe('28/09/2026');
  });

  it('converts timestamp values to Colombia time', () => {
    expect(formatDateTime('2026-09-29T02:30:00.000Z')).toContain('28 de septiembre 2026');
  });

  it('returns the original value when parsing fails', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });

  it('calculates today in Colombia independently of UTC day', () => {
    expect(todayLocal()).toBe('2026-09-28');
  });

  it.each([
    ['00:00', '12:00 a.m.'],
    ['08:15', '8:15 a.m.'],
    ['12:30', '12:30 p.m.'],
    ['20:45', '8:45 p.m.'],
    ['invalid', 'invalid']
  ])('formats %s as %s', (value, expected) => {
    expect(formatTime(value)).toBe(expected);
  });
});
