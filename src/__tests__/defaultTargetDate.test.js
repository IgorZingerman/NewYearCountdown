/**
 * Tests the real getNextNewYear() helper used for the default target date.
 */
import { getNextNewYear, DEFAULT_CONFIG } from '../lib/config.js';

describe('getNextNewYear', () => {
  test('returns Jan 1 of next year at LOCAL midnight (mid-year)', () => {
    const result = new Date(getNextNewYear(new Date(2026, 10, 21, 19, 57)));
    expect(result.getFullYear()).toBe(2027);
    expect(result.getMonth()).toBe(0);
    expect(result.getDate()).toBe(1);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
  });

  test('on Dec 31 at 23:59:59 the target is one second away', () => {
    const now = new Date(2026, 11, 31, 23, 59, 59);
    const target = new Date(getNextNewYear(now));
    expect(target.getTime() - now.getTime()).toBe(1000);
  });

  test('exactly at midnight Jan 1 targets the following year, not "now"', () => {
    const now = new Date(2027, 0, 1, 0, 0, 0);
    const target = new Date(getNextNewYear(now));
    expect(target.getFullYear()).toBe(2028);
  });

  test('returns a valid ISO string', () => {
    const iso = getNextNewYear();
    expect(new Date(iso).toISOString()).toBe(iso);
  });

  test('default config target date is in the future', () => {
    expect(new Date(DEFAULT_CONFIG.targetDate).getTime()).toBeGreaterThan(Date.now());
  });
});
