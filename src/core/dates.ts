/** All date math here works in UTC, so results don't depend on the visitor's timezone or DST rules. */

export interface Duration {
  years?: number;
  months?: number;
  weeks?: number;
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function addDuration(date: Date, duration: Duration): Date {
  const withCalendarFields = new Date(
    Date.UTC(
      date.getUTCFullYear() + (duration.years ?? 0),
      date.getUTCMonth() + (duration.months ?? 0),
      date.getUTCDate() + (duration.weeks ?? 0) * 7 + (duration.days ?? 0),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
    ),
  );

  const msOffset = (duration.hours ?? 0) * 3_600_000 + (duration.minutes ?? 0) * 60_000 + (duration.seconds ?? 0) * 1000;
  return new Date(withCalendarFields.getTime() + msOffset);
}

export function dayOfWeek(date: Date): string {
  return WEEKDAYS[date.getUTCDay()];
}

/** Whole calendar days between two dates (time-of-day is ignored; each date is normalized to UTC midnight). */
export function daysBetween(a: Date, b: Date): number {
  const utcMidnight = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return Math.round((utcMidnight(b) - utcMidnight(a)) / 86_400_000);
}
