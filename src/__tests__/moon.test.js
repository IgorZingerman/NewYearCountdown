/**
 * Tests for the moon phase maths (src/lib/moon.js). Checked against real
 * moon events (UTC) so they test reality, not just the code's own logic.
 */
import {
  moonPhase,
  moonPhaseForCountdown,
  moonIllumination,
  moonGeometry,
  moonPhaseName,
} from '../lib/moon';

// The mean-month method is within about half a day, so 0.03 of a cycle (~0.9 days) is safe.
const TOLERANCE = 0.03;

describe('moonPhase', () => {
  test('new moon of 30 December 2024 (22:27 UTC) is phase ~0', () => {
    const p = moonPhase(new Date(Date.UTC(2024, 11, 30, 22, 27)));
    const distance = Math.min(p, 1 - p);
    expect(distance).toBeLessThan(TOLERANCE);
  });

  test('full moon of 15 December 2024 (06:02 UTC) is phase ~0.5', () => {
    const p = moonPhase(new Date(Date.UTC(2024, 11, 15, 6, 2)));
    expect(Math.abs(p - 0.5)).toBeLessThan(TOLERANCE);
  });

  test('always between 0 (inclusive) and 1 (exclusive), even before the reference date', () => {
    for (const year of [1900, 1970, 2000, 2026, 2100]) {
      for (let m = 0; m < 12; m++) {
        const p = moonPhase(new Date(Date.UTC(year, m, 13)));
        expect(p).toBeGreaterThanOrEqual(0);
        expect(p).toBeLessThan(1);
      }
    }
  });

  test('the next new moon is one cycle later (about 29.5 days)', () => {
    const start = Date.UTC(2026, 0, 1);
    const a = moonPhase(new Date(start));
    const b = moonPhase(new Date(start + 29.530588853 * 86400000));
    expect(Math.min(Math.abs(a - b), 1 - Math.abs(a - b))).toBeLessThan(0.001);
  });
});

describe('moonPhaseForCountdown', () => {
  const DAY = 86400000;
  const target = new Date(Date.UTC(2027, 0, 1));
  const at = (daysBefore) => new Date(target.getTime() - daysBefore * DAY);

  test('is a full moon at midnight', () => {
    expect(moonPhaseForCountdown(target, target)).toBeCloseTo(0.5, 6);
  });

  test('stays full after midnight', () => {
    expect(moonPhaseForCountdown(target, new Date(target.getTime() + 5 * DAY))).toBeCloseTo(0.5, 6);
  });

  test('is a half moon about a week out and a new moon about two weeks out', () => {
    expect(moonPhaseForCountdown(target, at(29.530588853 / 4))).toBeCloseTo(0.25, 6);
    const newMoon = moonPhaseForCountdown(target, at(29.530588853 / 2));
    expect(Math.min(newMoon, 1 - newMoon)).toBeCloseTo(0, 6); // 0 and 1 are the same moment in the cycle
  });

  test('gets fuller every day as the countdown approaches (over the last two weeks)', () => {
    let last = -1;
    for (let d = 14; d >= 0; d--) {
      const lit = moonIllumination(moonPhaseForCountdown(target, at(d)));
      expect(lit).toBeGreaterThan(last);
      last = lit;
    }
  });

  test('accepts ISO strings, and returns null for a bad date', () => {
    expect(moonPhaseForCountdown(target.toISOString(), target)).toBeCloseTo(0.5, 6);
    expect(moonPhaseForCountdown('not a date')).toBeNull();
    expect(moonPhaseForCountdown(undefined)).toBeNull();
  });

  test('is always between 0 (inclusive) and 1 (exclusive)', () => {
    for (let d = 0; d < 400; d += 3.7) {
      const p = moonPhaseForCountdown(target, at(d));
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThan(1);
    }
  });
});

describe('moonIllumination', () => {
  test('new is dark, full is fully lit, quarters are half lit', () => {
    expect(moonIllumination(0)).toBeCloseTo(0, 6);
    expect(moonIllumination(0.5)).toBeCloseTo(1, 6);
    expect(moonIllumination(0.25)).toBeCloseTo(0.5, 6);
    expect(moonIllumination(0.75)).toBeCloseTo(0.5, 6);
  });
});

describe('moonGeometry', () => {
  test('waxing phases are lit on the right, waning on the left', () => {
    expect(moonGeometry(0.1).waxing).toBe(true);
    expect(moonGeometry(0.9).waxing).toBe(false);
  });

  test('terminator is a full circle at full moon and a line at quarters', () => {
    expect(Math.abs(moonGeometry(0.5).u)).toBeCloseTo(1, 6);
    expect(moonGeometry(0.25).u).toBeCloseTo(0, 6);
    expect(moonGeometry(0.75).u).toBeCloseTo(0, 6);
  });

  test('crescents and gibbous phases have the terminator on the expected side', () => {
    // Waxing crescent: a thin lit sliver on the right, so the terminator bulges right (u > 0).
    expect(moonGeometry(0.1).u).toBeGreaterThan(0);
    // Waxing gibbous: more than half lit, so the terminator bulges left (u < 0).
    expect(moonGeometry(0.4).u).toBeLessThan(0);
    // Waning crescent: lit on the left, terminator bulges left (u < 0).
    expect(moonGeometry(0.9).u).toBeLessThan(0);
    // Waning gibbous: more than half lit, terminator bulges right (u > 0).
    expect(moonGeometry(0.6).u).toBeGreaterThan(0);
  });
});

describe('moonPhaseName', () => {
  test('names the eight phases', () => {
    expect(moonPhaseName(0)).toBe('New moon');
    expect(moonPhaseName(0.25)).toBe('First quarter');
    expect(moonPhaseName(0.5)).toBe('Full moon');
    expect(moonPhaseName(0.75)).toBe('Last quarter');
    expect(moonPhaseName(0.99)).toBe('New moon');
    expect(moonPhaseName(0.1)).toBe('Waxing crescent');
  });
});
