/**
 * Tests for the canvas snow maths (src/lib/snow.js). These import the real
 * code rather than re-implementing it.
 */
import {
  createFlake,
  createWind,
  flakeCount,
  speedScale,
  stepFlake,
  HORIZON,
  MAX_FLAKES,
} from '../lib/snow';

// Deterministic "random" so tests are repeatable.
function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

describe('flakeCount', () => {
  test('default density gives a gentle fall on a desktop screen', () => {
    expect(flakeCount(40, 1440, 900)).toBe(240);
  });

  test('phones get fewer flakes than desktops', () => {
    expect(flakeCount(40, 390, 844)).toBeLessThan(flakeCount(40, 1440, 900));
  });

  test('never exceeds the hard cap, even for huge screens and counts', () => {
    expect(flakeCount(200, 5000, 3000)).toBeLessThanOrEqual(MAX_FLAKES);
  });

  test('reduced motion uses far fewer flakes', () => {
    expect(flakeCount(40, 1440, 900, true)).toBeLessThan(flakeCount(40, 1440, 900) / 2);
  });

  test('bad input gives zero flakes instead of NaN', () => {
    expect(flakeCount(undefined, 1440, 900)).toBe(0);
    expect(flakeCount('abc', 1440, 900)).toBe(0);
  });
});

describe('speedScale', () => {
  test('the default setting is 1x', () => {
    expect(speedScale(4500)).toBe(1);
  });

  test('a bigger number means slower (as it did before)', () => {
    expect(speedScale(9000)).toBeLessThan(1);
    expect(speedScale(2250)).toBeGreaterThan(1);
  });

  test('is clamped and tolerates bad values', () => {
    expect(speedScale(1)).toBe(3);
    expect(speedScale(10 ** 9)).toBe(0.3);
    expect(speedScale(0)).toBe(1);
    expect(speedScale('nope')).toBe(1);
  });
});

describe('createFlake', () => {
  const rand = seeded(7);
  const flakes = Array.from({ length: 500 }, () => createFlake(1440, 900, rand));

  test('everything stays inside sensible ranges', () => {
    for (const f of flakes) {
      expect(f.z).toBeGreaterThanOrEqual(0);
      expect(f.z).toBeLessThanOrEqual(1);
      expect(f.x).toBeGreaterThanOrEqual(0);
      expect(f.x).toBeLessThanOrEqual(1440);
      expect(f.alpha).toBeGreaterThan(0);
      expect(f.alpha).toBeLessThanOrEqual(1);
      expect(f.radius).toBeGreaterThan(0);
    }
  });

  test('closer flakes are bigger, faster and brighter on average', () => {
    const near = flakes.filter((f) => f.z > 0.7);
    const far = flakes.filter((f) => f.z < 0.3);
    const avg = (list, key) => list.reduce((sum, f) => sum + f[key], 0) / list.length;
    expect(avg(near, 'radius')).toBeGreaterThan(avg(far, 'radius'));
    expect(avg(near, 'vy')).toBeGreaterThan(avg(far, 'vy'));
    expect(avg(near, 'alpha')).toBeGreaterThan(avg(far, 'alpha'));
  });

  test('there are more far flakes than near ones', () => {
    expect(flakes.filter((f) => f.z < 0.3).length).toBeGreaterThan(flakes.filter((f) => f.z > 0.7).length);
  });

  test('only close flakes are crystals', () => {
    expect(flakes.some((f) => f.crystal)).toBe(true);
    expect(flakes.filter((f) => f.crystal).every((f) => f.z > 0.55)).toBe(true);
  });

  test('far flakes land on the horizon, near ones at the screen bottom', () => {
    const far = createFlake(1440, 900, () => 0);
    expect(far.landY).toBeCloseTo(900 * HORIZON, 5);
    const near = flakes.reduce((a, b) => (a.z > b.z ? a : b));
    expect(near.landY).toBeGreaterThan(900 * 0.95);
  });

  test('new flakes can start above the screen', () => {
    const f = createFlake(1440, 900, seeded(3), false);
    expect(f.y).toBeLessThan(0);
  });
});

describe('createWind', () => {
  test('is calm and stays bounded without gusts', () => {
    const wind = createWind(seeded(2), false);
    for (let i = 0; i < 100; i++) expect(wind.step(0.016)).toBe(0);
  });

  test('has gentle breeze plus gusts that stay within a sane range', () => {
    const wind = createWind(seeded(5), true);
    let max = 0;
    let moved = false;
    for (let i = 0; i < 60 * 120; i++) {
      const w = wind.step(1 / 60);
      expect(Number.isFinite(w)).toBe(true);
      max = Math.max(max, Math.abs(w));
      if (Math.abs(w) > 1) moved = true;
    }
    expect(moved).toBe(true);
    expect(max).toBeLessThan(130);
  });

  test('gusts eventually happen (wind gets well above the breeze)', () => {
    const wind = createWind(seeded(11), true);
    let max = 0;
    for (let i = 0; i < 60 * 60; i++) max = Math.max(max, Math.abs(wind.step(1 / 60)));
    expect(max).toBeGreaterThan(30);
  });
});

describe('stepFlake', () => {
  test('flakes fall steadily and keep falling at the same speed', () => {
    const f = createFlake(1440, 900, seeded(9));
    f.y = 100;
    const y0 = f.y;
    stepFlake(f, 0.5, 0, 0, 1, 1440);
    const d1 = f.y - y0;
    const y1 = f.y;
    stepFlake(f, 0.5, 0.5, 0, 1, 1440);
    const d2 = f.y - y1;
    expect(d1).toBeGreaterThan(0);
    expect(d2).toBeCloseTo(d1, 5); // no slowing down, unlike the old easing
  });

  test('wind pushes close flakes harder than far ones', () => {
    const near = createFlake(1440, 900, seeded(4));
    const far = { ...near };
    near.z = 1;
    far.z = 0;
    near.swayAmp = far.swayAmp = 0;
    near.x = far.x = 700;
    stepFlake(near, 1, 0, 80, 1, 1440);
    stepFlake(far, 1, 0, 80, 1, 1440);
    expect(near.x - 700).toBeGreaterThan(far.x - 700);
    expect(far.x - 700).toBeGreaterThan(0);
  });

  test('flakes wrap around the sides instead of leaving', () => {
    const f = createFlake(1440, 900, seeded(6));
    f.x = 1440 + f.radius * 6 + 1;
    stepFlake(f, 0, 0, 0, 1, 1440);
    expect(f.x).toBeLessThan(1440);
  });

  test('flakes fade out and die when they reach their landing line', () => {
    const f = createFlake(1440, 900, seeded(8));
    f.y = f.landY - 100;
    stepFlake(f, 0.0001, 0, 0, 1, 1440);
    expect(f.fade).toBe(1);
    expect(f.dead).toBe(false);

    f.y = f.landY - 10;
    stepFlake(f, 0.0001, 0, 0, 1, 1440);
    expect(f.fade).toBeGreaterThan(0);
    expect(f.fade).toBeLessThan(1);

    f.y = f.landY + 1;
    stepFlake(f, 0.0001, 0, 0, 1, 1440);
    expect(f.dead).toBe(true);
    expect(f.fade).toBe(0);
  });
});
