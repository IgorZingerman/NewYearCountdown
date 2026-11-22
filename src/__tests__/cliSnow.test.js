/**
 * Tests for the terminal version's snow (src/cli/snow.js) and its config (src/cli/config.js).
 * These import the real code.
 *
 * Snow `speed` means the same as on the website: the milliseconds an average flake takes to fall
 * from the top to the bottom (bigger = slower).
 */
import config from '../cli/config.js';
import { DEFAULT_SNOW_SPEED, SNOW_TICK_MS, createFlake, moveFlake } from '../cli/snow.js';
import { SNOW_SPEEDS } from '../lib/config.js';

const SCREEN = { width: 80, height: 40 };

// A flake with exactly average pace and no sideways drift, so the maths is easy to check
const steady = (y = 0) => ({ x: 10, y, pace: 1, sway: 0 });

// Ticks it takes the flake to leave the bottom (it restarts at y = -1)
function ticksToFall(speed, flake = steady()) {
  let current = flake;
  for (let ticks = 1; ticks < 100000; ticks += 1) {
    current = moveFlake(current, { ...SCREEN, speed });
    if (current.y === -1) return ticks;
  }
  throw new Error('the flake never reached the bottom');
}

describe('CLI snow speed', () => {
  test('an average flake falls the whole screen in about `speed` milliseconds', () => {
    [2800, 4500, 7000, 9000].forEach((speed) => {
      const ms = ticksToFall(speed) * SNOW_TICK_MS;
      expect(Math.abs(ms - speed)).toBeLessThanOrEqual(SNOW_TICK_MS);
    });
  });

  test('a bigger speed number is slower (the bug was the other way round)', () => {
    expect(ticksToFall(7000)).toBeGreaterThan(ticksToFall(4500));
    expect(ticksToFall(4500)).toBeGreaterThan(ticksToFall(2800));
  });

  test('one tick never moves a flake more than a few rows at the default speed', () => {
    const moved = moveFlake(steady(), { ...SCREEN, speed: DEFAULT_SNOW_SPEED });
    expect(moved.y).toBeGreaterThan(0);
    expect(moved.y).toBeLessThan(3);
  });

  test('defaults to the website\'s "normal" speed and the config uses it', () => {
    expect(DEFAULT_SNOW_SPEED).toBe(SNOW_SPEEDS.normal);
    expect(config.snowflakes.speed).toBe(SNOW_SPEEDS.normal);
  });

  test('a faster flake (bigger pace) falls sooner than a slower one', () => {
    const fast = ticksToFall(4500, { ...steady(), pace: 1.3 });
    const slow = ticksToFall(4500, { ...steady(), pace: 0.7 });
    expect(fast).toBeLessThan(slow);
  });
});

describe('CLI flakes', () => {
  test('a flake that reaches the bottom restarts above the top at a random column', () => {
    const rand = () => 0.5;
    const moved = moveFlake(steady(SCREEN.height - 0.01), { ...SCREEN, speed: 4500 }, rand);
    expect(moved.y).toBe(-1);
    expect(moved.x).toBe(Math.floor(0.5 * SCREEN.width));
  });

  test('flakes wrap around the sides', () => {
    const left = moveFlake({ x: 0.1, y: 5, pace: 1, sway: -0.25 }, { ...SCREEN, speed: 100 });
    expect(left.x).toBe(SCREEN.width - 1);
    const right = moveFlake({ x: SCREEN.width - 0.1, y: 5, pace: 1, sway: 0.25 }, { ...SCREEN, speed: 100 });
    expect(right.x).toBe(0);
  });

  test('sway moves a flake sideways as it falls', () => {
    const moved = moveFlake({ x: 10, y: 5, pace: 1, sway: 0.2 }, { ...SCREEN, speed: 4500 });
    expect(moved.x).toBeGreaterThan(10);
  });

  test('new flakes start on the screen with an average-ish pace and a gentle sway', () => {
    for (let i = 0; i < 200; i += 1) {
      const flake = createFlake(SCREEN.width, SCREEN.height);
      expect(flake.x).toBeGreaterThanOrEqual(0);
      expect(flake.x).toBeLessThan(SCREEN.width);
      expect(flake.y).toBeGreaterThanOrEqual(0);
      expect(flake.y).toBeLessThan(SCREEN.height);
      expect(flake.pace).toBeGreaterThanOrEqual(0.7);
      expect(flake.pace).toBeLessThanOrEqual(1.3);
      expect(Math.abs(flake.sway)).toBeLessThanOrEqual(0.25);
    }
  });

  test('moving a flake does not change the one passed in', () => {
    const flake = steady(5);
    moveFlake(flake, { ...SCREEN, speed: 4500 });
    expect(flake).toEqual(steady(5));
  });
});

describe('CLI config', () => {
  test('has only the settings the terminal version reads', () => {
    expect(Object.keys(config).sort()).toEqual(['color', 'font', 'snowflakes', 'targetDate']);
    expect(Object.keys(config.font).sort()).toEqual(['frequency', 'name', 'rotate', 'rotationOptions']);
    expect(Object.keys(config.snowflakes).sort()).toEqual(['color', 'count', 'enabled', 'options', 'speed']);
  });
});
