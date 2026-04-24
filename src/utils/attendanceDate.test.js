import { describe, it, expect } from 'vitest';
import { toIsoDate, currentSundayIso, formatPtBrDate } from './attendanceDate';

describe('toIsoDate', () => {
  it('formats a local Date as YYYY-MM-DD', () => {
    expect(toIsoDate(new Date(2026, 3, 19))).toBe('2026-04-19');
    expect(toIsoDate(new Date(2026, 0, 4))).toBe('2026-01-04');
  });
});

describe('currentSundayIso', () => {
  it('returns today when today is Sunday', () => {
    const sunday = new Date(2026, 3, 19); // Sun Apr 19 2026
    expect(currentSundayIso(sunday)).toBe('2026-04-19');
  });

  it('returns the most recent past Sunday on weekdays', () => {
    const monday = new Date(2026, 3, 20);
    expect(currentSundayIso(monday)).toBe('2026-04-19');
    const wednesday = new Date(2026, 3, 22);
    expect(currentSundayIso(wednesday)).toBe('2026-04-19');
    const saturday = new Date(2026, 3, 25);
    expect(currentSundayIso(saturday)).toBe('2026-04-19');
  });

  it('crosses month and year boundaries correctly', () => {
    // Thu Jan 1 2026 -> previous Sunday is Sun Dec 28 2025
    expect(currentSundayIso(new Date(2026, 0, 1))).toBe('2025-12-28');
    // Sat Feb 28 2026 -> previous Sunday is Sun Feb 22 2026
    expect(currentSundayIso(new Date(2026, 1, 28))).toBe('2026-02-22');
  });

  it('is unaffected by DST transitions (Brazil no longer observes DST, but US still does)', () => {
    // US DST start 2026: Sun Mar 8, so Mon Mar 9 must still resolve to Mar 8.
    expect(currentSundayIso(new Date(2026, 2, 9))).toBe('2026-03-08');
  });
});

describe('formatPtBrDate', () => {
  it('returns empty string for empty input', () => {
    expect(formatPtBrDate('')).toBe('');
    expect(formatPtBrDate(null)).toBe('');
  });

  it('returns the input unchanged for malformed dates', () => {
    expect(formatPtBrDate('not-a-date')).toBe('not-a-date');
  });

  it('formats an ISO date in pt-BR locale', () => {
    const formatted = formatPtBrDate('2026-04-19');
    expect(formatted.toLowerCase()).toContain('abril');
    expect(formatted).toContain('2026');
    expect(formatted).toContain('19');
  });
});
