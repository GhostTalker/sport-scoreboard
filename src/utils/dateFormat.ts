/**
 * Date Formatting Utilities
 *
 * Centralized date/time formatting for German locale (de-DE).
 * Handles UTC to local timezone conversion automatically.
 *
 * This is mission control for all things time-related!
 */

/**
 * Formats an ISO date string to German date format (DD.MM.YYYY)
 *
 * @param isoDate - ISO 8601 date string (e.g., "2026-01-17T18:00:00Z")
 * @returns Formatted date string (e.g., "17.01.2026")
 *
 * @example
 * formatGameDate("2026-01-17T18:00:00Z") // "17.01.2026"
 */
export function formatGameDate(isoDate: string): string {
  if (!isoDate) return '';

  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return '';

  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Formats an ISO date string to German 24-hour time format (HH:MM)
 *
 * @param isoDate - ISO 8601 date string (e.g., "2026-01-17T18:00:00Z")
 * @returns Formatted time string (e.g., "19:00" - converted to local timezone)
 *
 * @example
 * formatGameTime("2026-01-17T18:00:00Z") // "19:00" (in CET timezone)
 */
export function formatGameTime(isoDate: string): string {
  if (!isoDate) return '';

  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return '';

  return date.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formats an ISO date string to German date and time format (DD.MM.YYYY HH:MM)
 *
 * @param isoDate - ISO 8601 date string (e.g., "2026-01-17T18:00:00Z")
 * @returns Formatted date and time string (e.g., "17.01.2026 19:00")
 *
 * @example
 * formatGameDateTime("2026-01-17T18:00:00Z") // "17.01.2026 19:00"
 */
export function formatGameDateTime(isoDate: string): string {
  if (!isoDate) return '';

  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return '';

  const dateStr = formatGameDate(isoDate);
  const timeStr = formatGameTime(isoDate);

  return `${dateStr} ${timeStr}`;
}

/**
 * Formats an ISO date string to relative time in German
 * (e.g., "vor 5 Minuten", "in 2 Stunden")
 *
 * @param isoDate - ISO 8601 date string (e.g., "2026-01-17T18:00:00Z")
 * @returns Relative time string in German
 *
 * @example
 * formatRelativeTime("2026-01-17T18:00:00Z") // "vor 5 Minuten" or "in 2 Stunden"
 */
export function formatRelativeTime(isoDate: string): string {
  if (!isoDate) return '';

  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffSeconds = Math.round(diffMs / 1000);
  const absDiffSeconds = Math.abs(diffSeconds);

  // Past or future?
  const isPast = diffSeconds < 0;

  // Less than a minute
  if (absDiffSeconds < 60) {
    return isPast ? 'vor wenigen Sekunden' : 'in wenigen Sekunden';
  }

  // Less than an hour
  if (absDiffSeconds < 3600) {
    const minutes = Math.floor(absDiffSeconds / 60);
    const minuteWord = minutes === 1 ? 'Minute' : 'Minuten';
    return isPast ? `vor ${minutes} ${minuteWord}` : `in ${minutes} ${minuteWord}`;
  }

  // Less than a day
  if (absDiffSeconds < 86400) {
    const hours = Math.floor(absDiffSeconds / 3600);
    const hourWord = hours === 1 ? 'Stunde' : 'Stunden';
    return isPast ? `vor ${hours} ${hourWord}` : `in ${hours} ${hourWord}`;
  }

  // Less than a week
  if (absDiffSeconds < 604800) {
    const days = Math.floor(absDiffSeconds / 86400);
    const dayWord = days === 1 ? 'Tag' : 'Tagen';
    return isPast ? `vor ${days} ${dayWord}` : `in ${days} ${dayWord}`;
  }

  // Fall back to formatted date for longer periods
  return formatGameDate(isoDate);
}

/**
 * Formats match duration for soccer/football games
 * (e.g., "90'" or "45+3'")
 *
 * @param minutes - Total minutes played
 * @param addedTime - Optional injury/stoppage time minutes
 * @returns Formatted duration string (e.g., "90'" or "45+3'")
 *
 * @example
 * formatMatchDuration(45) // "45'"
 * formatMatchDuration(45, 3) // "45+3'"
 * formatMatchDuration(90) // "90'"
 */
export function formatMatchDuration(minutes: number, addedTime?: number): string {
  if (minutes < 0) return '';

  if (addedTime && addedTime > 0) {
    return `${minutes}+${addedTime}'`;
  }

  return `${minutes}'`;
}

/**
 * Formats a date with relative day labels (HEUTE, MORGEN, GESTERN)
 * or short date format for other days
 *
 * This is the combined formatter used in game selectors and scoreboards.
 *
 * @param isoDate - ISO 8601 date string
 * @returns Object with date label and formatted time
 *
 * @example
 * formatGameDateTimeRelative("2026-01-17T18:00:00Z")
 * // If today: { date: "HEUTE", time: "19:00" }
 * // If tomorrow: { date: "MORGEN", time: "19:00" }
 * // If other: { date: "SA., 17.1.", time: "19:00" }
 */
export function formatGameDateTimeRelative(isoDate: string): { date: string; time: string } {
  if (!isoDate) return { date: '', time: 'TBD' };

  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return { date: '', time: 'TBD' };

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const time = formatGameTime(isoDate);

  if (isToday) {
    return { date: 'HEUTE', time };
  }

  if (isTomorrow) {
    return { date: 'MORGEN', time };
  }

  if (isYesterday) {
    return { date: 'GESTERN', time };
  }

  // Format as short date with weekday
  const dateFormatted = date
    .toLocaleDateString('de-DE', {
      weekday: 'short',
      day: 'numeric',
      month: 'numeric',
    })
    .toUpperCase();

  return { date: dateFormatted, time };
}

/**
 * Formats a date for display in stale data banners and similar contexts
 * Uses relative time for recent dates, falls back to full format for older dates
 *
 * @param date - Date object to format
 * @returns Formatted relative or absolute time string
 *
 * @example
 * formatLastFetchTime(new Date()) // "vor wenigen Sekunden"
 * formatLastFetchTime(oldDate) // "17.01. 19:00"
 */
export function formatLastFetchTime(date: Date | null): string {
  if (!date) return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);

  // Less than a minute
  if (diffSeconds < 60) {
    return 'vor wenigen Sekunden';
  }

  // Less than an hour
  if (diffSeconds < 3600) {
    const minutes = Math.floor(diffSeconds / 60);
    return `vor ${minutes} Minuten`;
  }

  // Less than a day
  if (diffSeconds < 86400) {
    const hours = Math.floor(diffSeconds / 3600);
    return `vor ${hours} Stunden`;
  }

  // Fall back to short date/time format
  return date.toLocaleString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Checks if a date is today
 *
 * @param isoDate - ISO 8601 date string
 * @returns true if the date is today
 */
export function isToday(isoDate: string): boolean {
  if (!isoDate) return false;

  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return false;

  const now = new Date();
  return date.toDateString() === now.toDateString();
}

/**
 * Checks if a date is in the past
 *
 * @param isoDate - ISO 8601 date string
 * @returns true if the date is in the past
 */
export function isPast(isoDate: string): boolean {
  if (!isoDate) return false;

  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return false;

  return date.getTime() < Date.now();
}

/**
 * Checks if a date is in the future
 *
 * @param isoDate - ISO 8601 date string
 * @returns true if the date is in the future
 */
export function isFuture(isoDate: string): boolean {
  if (!isoDate) return false;

  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return false;

  return date.getTime() > Date.now();
}
