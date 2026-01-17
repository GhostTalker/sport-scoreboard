/**
 * Date Format Utility Tests
 *
 * Testing all the time-related utilities - because every mission
 * needs reliable chronometers!
 *
 * Note: Some tests use vi.useFakeTimers() to control time.
 * We're basically time travelers here.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  formatGameDate,
  formatGameTime,
  formatGameDateTime,
  formatRelativeTime,
  formatMatchDuration,
  formatGameDateTimeRelative,
  formatLastFetchTime,
  isToday,
  isPast,
  isFuture,
} from '../dateFormat';

describe('formatGameDate', () => {
  it('should format ISO date to German date format (DD.MM.YYYY)', () => {
    const result = formatGameDate('2026-01-17T18:00:00Z');
    expect(result).toBe('17.01.2026');
  });

  it('should handle dates in different months', () => {
    expect(formatGameDate('2026-12-25T12:00:00Z')).toBe('25.12.2026');
    expect(formatGameDate('2026-06-01T00:00:00Z')).toBe('01.06.2026');
  });

  it('should return empty string for empty input', () => {
    expect(formatGameDate('')).toBe('');
  });

  it('should return empty string for invalid date', () => {
    expect(formatGameDate('not-a-date')).toBe('');
    expect(formatGameDate('2026-13-45')).toBe(''); // Invalid month/day
  });

  it('should handle dates with timezone offsets', () => {
    // This tests timezone conversion - the actual date shown depends on local timezone
    const result = formatGameDate('2026-01-17T23:00:00+02:00');
    expect(result).toMatch(/\d{2}\.\d{2}\.\d{4}/);
  });
});

describe('formatGameTime', () => {
  it('should format ISO date to German 24-hour time format (HH:MM)', () => {
    // Note: Result depends on local timezone, so we just verify format
    const result = formatGameTime('2026-01-17T18:00:00Z');
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });

  it('should return empty string for empty input', () => {
    expect(formatGameTime('')).toBe('');
  });

  it('should return empty string for invalid date', () => {
    expect(formatGameTime('not-a-date')).toBe('');
  });

  it('should handle midnight correctly', () => {
    const result = formatGameTime('2026-01-17T00:00:00Z');
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });
});

describe('formatGameDateTime', () => {
  it('should combine date and time in German format', () => {
    const result = formatGameDateTime('2026-01-17T18:00:00Z');
    // Format: DD.MM.YYYY HH:MM
    expect(result).toMatch(/^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}$/);
    expect(result).toContain('17.01.2026');
  });

  it('should return empty string for empty input', () => {
    expect(formatGameDateTime('')).toBe('');
  });

  it('should return empty string for invalid date', () => {
    expect(formatGameDateTime('invalid')).toBe('');
  });
});

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Set current time to 2026-01-17T12:00:00Z
    vi.setSystemTime(new Date('2026-01-17T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should format recent past as "vor wenigen Sekunden"', () => {
    const result = formatRelativeTime('2026-01-17T11:59:30Z');
    expect(result).toBe('vor wenigen Sekunden');
  });

  it('should format near future as "in wenigen Sekunden"', () => {
    const result = formatRelativeTime('2026-01-17T12:00:30Z');
    expect(result).toBe('in wenigen Sekunden');
  });

  it('should format minutes ago correctly (singular)', () => {
    const result = formatRelativeTime('2026-01-17T11:59:00Z');
    expect(result).toBe('vor 1 Minute');
  });

  it('should format minutes ago correctly (plural)', () => {
    const result = formatRelativeTime('2026-01-17T11:55:00Z');
    expect(result).toBe('vor 5 Minuten');
  });

  it('should format minutes from now correctly (singular)', () => {
    const result = formatRelativeTime('2026-01-17T12:01:00Z');
    expect(result).toBe('in 1 Minute');
  });

  it('should format minutes from now correctly (plural)', () => {
    const result = formatRelativeTime('2026-01-17T12:30:00Z');
    expect(result).toBe('in 30 Minuten');
  });

  it('should format hours ago correctly (singular)', () => {
    const result = formatRelativeTime('2026-01-17T11:00:00Z');
    expect(result).toBe('vor 1 Stunde');
  });

  it('should format hours ago correctly (plural)', () => {
    const result = formatRelativeTime('2026-01-17T09:00:00Z');
    expect(result).toBe('vor 3 Stunden');
  });

  it('should format hours from now correctly (singular)', () => {
    const result = formatRelativeTime('2026-01-17T13:00:00Z');
    expect(result).toBe('in 1 Stunde');
  });

  it('should format hours from now correctly (plural)', () => {
    const result = formatRelativeTime('2026-01-17T14:00:00Z');
    expect(result).toBe('in 2 Stunden');
  });

  it('should format days ago correctly (singular)', () => {
    const result = formatRelativeTime('2026-01-16T12:00:00Z');
    expect(result).toBe('vor 1 Tag');
  });

  it('should format days ago correctly (plural)', () => {
    const result = formatRelativeTime('2026-01-14T12:00:00Z');
    expect(result).toBe('vor 3 Tagen');
  });

  it('should format days from now correctly (singular)', () => {
    const result = formatRelativeTime('2026-01-18T12:00:00Z');
    expect(result).toBe('in 1 Tag');
  });

  it('should format days from now correctly (plural)', () => {
    const result = formatRelativeTime('2026-01-20T12:00:00Z');
    expect(result).toBe('in 3 Tagen');
  });

  it('should fall back to date format for weeks', () => {
    const result = formatRelativeTime('2026-01-01T12:00:00Z');
    expect(result).toBe('01.01.2026');
  });

  it('should return empty string for empty input', () => {
    expect(formatRelativeTime('')).toBe('');
  });

  it('should return empty string for invalid date', () => {
    expect(formatRelativeTime('invalid')).toBe('');
  });
});

describe('formatMatchDuration', () => {
  it('should format regular match minutes', () => {
    expect(formatMatchDuration(45)).toBe("45'");
    expect(formatMatchDuration(90)).toBe("90'");
    expect(formatMatchDuration(0)).toBe("0'");
  });

  it('should format minutes with added time', () => {
    expect(formatMatchDuration(45, 3)).toBe("45+3'");
    expect(formatMatchDuration(90, 5)).toBe("90+5'");
  });

  it('should ignore zero added time', () => {
    expect(formatMatchDuration(45, 0)).toBe("45'");
  });

  it('should return empty string for negative minutes', () => {
    expect(formatMatchDuration(-5)).toBe('');
  });

  it('should handle large minute values', () => {
    expect(formatMatchDuration(120)).toBe("120'");
    expect(formatMatchDuration(120, 10)).toBe("120+10'");
  });
});

describe('formatGameDateTimeRelative', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Set current time to 2026-01-17T12:00:00Z
    vi.setSystemTime(new Date('2026-01-17T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return HEUTE for today', () => {
    const result = formatGameDateTimeRelative('2026-01-17T18:00:00Z');
    expect(result.date).toBe('HEUTE');
    expect(result.time).toMatch(/^\d{2}:\d{2}$/);
  });

  it('should return MORGEN for tomorrow', () => {
    const result = formatGameDateTimeRelative('2026-01-18T18:00:00Z');
    expect(result.date).toBe('MORGEN');
    expect(result.time).toMatch(/^\d{2}:\d{2}$/);
  });

  it('should return GESTERN for yesterday', () => {
    const result = formatGameDateTimeRelative('2026-01-16T18:00:00Z');
    expect(result.date).toBe('GESTERN');
    expect(result.time).toMatch(/^\d{2}:\d{2}$/);
  });

  it('should return short date format for other days', () => {
    const result = formatGameDateTimeRelative('2026-01-20T18:00:00Z');
    // Should be uppercase with weekday
    expect(result.date).toMatch(/[A-Z]/);
    expect(result.date).not.toBe('HEUTE');
    expect(result.date).not.toBe('MORGEN');
    expect(result.date).not.toBe('GESTERN');
    expect(result.time).toMatch(/^\d{2}:\d{2}$/);
  });

  it('should return TBD for empty input', () => {
    const result = formatGameDateTimeRelative('');
    expect(result.date).toBe('');
    expect(result.time).toBe('TBD');
  });

  it('should return TBD for invalid date', () => {
    const result = formatGameDateTimeRelative('invalid');
    expect(result.date).toBe('');
    expect(result.time).toBe('TBD');
  });
});

describe('formatLastFetchTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-17T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return empty string for null', () => {
    expect(formatLastFetchTime(null)).toBe('');
  });

  it('should format recent time as "vor wenigen Sekunden"', () => {
    const recentDate = new Date('2026-01-17T11:59:45Z');
    expect(formatLastFetchTime(recentDate)).toBe('vor wenigen Sekunden');
  });

  it('should format minutes ago', () => {
    const minutesAgo = new Date('2026-01-17T11:55:00Z');
    expect(formatLastFetchTime(minutesAgo)).toBe('vor 5 Minuten');
  });

  it('should format hours ago', () => {
    const hoursAgo = new Date('2026-01-17T09:00:00Z');
    expect(formatLastFetchTime(hoursAgo)).toBe('vor 3 Stunden');
  });

  it('should fall back to date format for days ago', () => {
    const daysAgo = new Date('2026-01-15T12:00:00Z');
    const result = formatLastFetchTime(daysAgo);
    // Should contain time and day/month
    expect(result).toMatch(/\d{2}:\d{2}/);
  });
});

describe('isToday', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-17T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return true for today', () => {
    // Use midday UTC to avoid timezone edge cases
    expect(isToday('2026-01-17T12:00:00Z')).toBe(true);
    expect(isToday('2026-01-17T10:00:00Z')).toBe(true);
  });

  it('should return false for other days', () => {
    expect(isToday('2026-01-16T12:00:00Z')).toBe(false);
    expect(isToday('2026-01-18T12:00:00Z')).toBe(false);
  });

  it('should return false for empty input', () => {
    expect(isToday('')).toBe(false);
  });

  it('should return false for invalid date', () => {
    expect(isToday('invalid')).toBe(false);
  });
});

describe('isPast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-17T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return true for past dates', () => {
    expect(isPast('2026-01-17T11:59:59Z')).toBe(true);
    expect(isPast('2026-01-16T12:00:00Z')).toBe(true);
    expect(isPast('2020-01-01T00:00:00Z')).toBe(true);
  });

  it('should return false for future dates', () => {
    expect(isPast('2026-01-17T12:00:01Z')).toBe(false);
    expect(isPast('2026-01-18T12:00:00Z')).toBe(false);
    expect(isPast('2030-01-01T00:00:00Z')).toBe(false);
  });

  it('should return false for empty input', () => {
    expect(isPast('')).toBe(false);
  });

  it('should return false for invalid date', () => {
    expect(isPast('invalid')).toBe(false);
  });
});

describe('isFuture', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-17T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return true for future dates', () => {
    expect(isFuture('2026-01-17T12:00:01Z')).toBe(true);
    expect(isFuture('2026-01-18T12:00:00Z')).toBe(true);
    expect(isFuture('2030-01-01T00:00:00Z')).toBe(true);
  });

  it('should return false for past dates', () => {
    expect(isFuture('2026-01-17T11:59:59Z')).toBe(false);
    expect(isFuture('2026-01-16T12:00:00Z')).toBe(false);
    expect(isFuture('2020-01-01T00:00:00Z')).toBe(false);
  });

  it('should return false for empty input', () => {
    expect(isFuture('')).toBe(false);
  });

  it('should return false for invalid date', () => {
    expect(isFuture('invalid')).toBe(false);
  });
});

describe('Edge Cases & Error Handling', () => {
  it('should handle undefined gracefully', () => {
    // TypeScript would catch this, but testing runtime behavior
    expect(formatGameDate(undefined as unknown as string)).toBe('');
    expect(formatGameTime(undefined as unknown as string)).toBe('');
    expect(formatGameDateTime(undefined as unknown as string)).toBe('');
    expect(formatRelativeTime(undefined as unknown as string)).toBe('');
  });

  it('should handle null gracefully', () => {
    expect(formatGameDate(null as unknown as string)).toBe('');
    expect(formatGameTime(null as unknown as string)).toBe('');
    expect(formatGameDateTime(null as unknown as string)).toBe('');
    expect(formatRelativeTime(null as unknown as string)).toBe('');
  });

  it('should handle partial ISO date strings', () => {
    // Just date without time - should still work
    expect(formatGameDate('2026-01-17')).toBe('17.01.2026');
  });

  it('should handle dates with milliseconds', () => {
    const result = formatGameDate('2026-01-17T18:00:00.123Z');
    expect(result).toBe('17.01.2026');
  });

  it('should handle very old dates', () => {
    const result = formatGameDate('1900-01-01T00:00:00Z');
    expect(result).toBe('01.01.1900');
  });

  it('should handle far future dates', () => {
    // Use midday to avoid timezone conversion pushing to next day
    const result = formatGameDate('2099-12-31T12:00:00Z');
    expect(result).toBe('31.12.2099');
  });
});
