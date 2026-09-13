import { describe, expect, it } from 'vitest';
import { addDuration, dayOfWeek, daysBetween } from '../dates';

describe('addDuration', () => {
  it('adds days', () => {
    const result = addDuration(new Date(Date.UTC(2026, 0, 1)), { days: 10 });
    expect(result.toISOString()).toBe(new Date(Date.UTC(2026, 0, 11)).toISOString());
  });

  it('adds months, clamped by JS Date rollover semantics', () => {
    const result = addDuration(new Date(Date.UTC(2026, 0, 31)), { months: 1 });
    // Jan 31 + 1 month rolls into March in standard Date arithmetic (Feb has no 31st).
    expect(result.getUTCMonth()).toBe(2);
  });

  it('adds years', () => {
    const result = addDuration(new Date(Date.UTC(2024, 1, 29)), { years: 1 });
    // 2024 is a leap year; Feb 29 + 1 year rolls into March 1 in a non-leap year.
    expect(result.getUTCFullYear()).toBe(2025);
    expect(result.getUTCMonth()).toBe(2);
    expect(result.getUTCDate()).toBe(1);
  });

  it('adds weeks and days together', () => {
    const result = addDuration(new Date(Date.UTC(2026, 0, 1)), { weeks: 1, days: 2 });
    expect(result.toISOString()).toBe(new Date(Date.UTC(2026, 0, 10)).toISOString());
  });

  it('subtracts via negative values', () => {
    const result = addDuration(new Date(Date.UTC(2026, 0, 10)), { days: -10 });
    expect(result.toISOString()).toBe(new Date(Date.UTC(2025, 11, 31)).toISOString());
  });
});

describe('dayOfWeek', () => {
  it('identifies a known date', () => {
    // 2026-01-01 is a Thursday.
    expect(dayOfWeek(new Date(Date.UTC(2026, 0, 1)))).toBe('Thursday');
  });
});

describe('daysBetween', () => {
  it('counts whole days between two dates', () => {
    expect(daysBetween(new Date(Date.UTC(2026, 0, 1)), new Date(Date.UTC(2026, 0, 11)))).toBe(10);
  });

  it('ignores time-of-day', () => {
    const a = new Date(Date.UTC(2026, 0, 1, 23, 59));
    const b = new Date(Date.UTC(2026, 0, 2, 0, 1));
    expect(daysBetween(a, b)).toBe(1);
  });

  it('is negative when b is before a', () => {
    expect(daysBetween(new Date(Date.UTC(2026, 0, 11)), new Date(Date.UTC(2026, 0, 1)))).toBe(-10);
  });
});
