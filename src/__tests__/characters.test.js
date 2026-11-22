/**
 * Tests for the logic behind the characters: lanes (world.js), walking and
 * following (wander.js) and posing helpers (pose.js). They import the real code.
 */
import { ground, FOOT_BACK_VH, FOOT_FRONT_VH } from '../lib/world';
import {
  brake,
  createMover,
  createWanderer,
  moveToward,
  stepFollow,
  stepWander,
} from '../lib/wander';
import { createBlinker, createInterval, tf } from '../lib/pose';
import { OWL_TREE, TREES, treeBottomVh, treeTipVh } from '../lib/scene';

// Deterministic "random" so tests are repeatable.
function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const FPS = 1 / 60;
const OPTS = { maxSpeed: 100, accel: 400, slowRadius: 100 };

describe('ground lanes', () => {
  test('back lane is higher, smaller and behind; front lane is lower, bigger and in front', () => {
    const back = ground(0);
    const front = ground(1);
    expect(back.bottomVh).toBe(FOOT_BACK_VH);
    expect(front.bottomVh).toBe(FOOT_FRONT_VH);
    expect(back.bottomVh).toBeGreaterThan(front.bottomVh);
    expect(back.scale).toBeLessThan(front.scale);
    expect(back.z).toBeLessThan(front.z);
  });

  test('depth outside 0..1 is clamped', () => {
    expect(ground(-5)).toEqual(ground(0));
    expect(ground(7)).toEqual(ground(1));
  });

  test('characters always sit above the fireworks (5) and below the snow (10)', () => {
    for (let d = 0; d <= 1; d += 0.05) {
      const { z } = ground(d);
      expect(z).toBeGreaterThan(5);
      expect(z).toBeLessThan(10);
    }
  });
});

describe('moveToward', () => {
  test('arrives at the target and stops', () => {
    const m = createMover(0);
    let arrived = false;
    for (let i = 0; i < 60 * 30 && !arrived; i++) arrived = moveToward(m, 500, FPS, OPTS);
    expect(arrived).toBe(true);
    expect(m.x).toBe(500);
    expect(m.vx).toBe(0);
  });

  test('never exceeds max speed and never overshoots by more than a pixel', () => {
    const m = createMover(0);
    let maxV = 0;
    let maxX = 0;
    for (let i = 0; i < 60 * 30; i++) {
      moveToward(m, 400, FPS, OPTS);
      maxV = Math.max(maxV, Math.abs(m.vx));
      maxX = Math.max(maxX, m.x);
    }
    expect(maxV).toBeLessThanOrEqual(OPTS.maxSpeed + 1e-9);
    expect(maxX).toBeLessThanOrEqual(401);
  });

  test('faces the way it is walking', () => {
    const right = createMover(0);
    for (let i = 0; i < 60; i++) moveToward(right, 500, FPS, OPTS);
    expect(right.dir).toBe(1);

    const left = createMover(500);
    for (let i = 0; i < 60; i++) moveToward(left, 0, FPS, OPTS);
    expect(left.dir).toBe(-1);
  });

  test('speeds up gradually instead of jumping to full speed', () => {
    const m = createMover(0);
    moveToward(m, 1000, FPS, OPTS);
    expect(m.vx).toBeGreaterThan(0);
    expect(m.vx).toBeLessThan(OPTS.maxSpeed / 4);
  });
});

describe('brake', () => {
  test('comes to a stop without reversing', () => {
    const m = createMover(0);
    m.vx = 80;
    for (let i = 0; i < 60 * 5; i++) {
      brake(m, FPS, 300);
      expect(m.vx).toBeGreaterThanOrEqual(0);
    }
    expect(m.vx).toBe(0);
  });
});

describe('stepWander', () => {
  const opts = { minX: 100, maxX: 1300, maxSpeed: 100, accel: 400, idleRange: [0.5, 1], slowRadius: 100 };

  test('alternates between resting and walking, staying inside the allowed range', () => {
    const rand = seeded(3);
    const w = createWanderer(rand);
    const m = createMover(700);
    const modes = new Set();
    for (let i = 0; i < 60 * 120; i++) {
      stepWander(w, m, FPS, { ...opts, rand });
      modes.add(w.mode);
      expect(m.x).toBeGreaterThanOrEqual(opts.minX - 5);
      expect(m.x).toBeLessThanOrEqual(opts.maxX + 5);
      expect(m.depth).toBeGreaterThanOrEqual(0);
      expect(m.depth).toBeLessThanOrEqual(1);
    }
    expect(modes).toEqual(new Set(['idle', 'walk']));
  });

  test('picks trips long enough to be worth walking', () => {
    const rand = seeded(8);
    const w = createWanderer(rand);
    const m = createMover(700);
    const trips = [];
    let prev = 'idle';
    for (let i = 0; i < 60 * 300; i++) {
      stepWander(w, m, FPS, { ...opts, rand });
      if (prev === 'idle' && w.mode === 'walk') trips.push(w.tripLen);
      prev = w.mode;
    }
    expect(trips.length).toBeGreaterThan(5);
    expect(trips.filter((t) => t >= 100).length).toBeGreaterThan(trips.length * 0.8);
  });

  test('does not move while resting', () => {
    const w = createWanderer(() => 0.5);
    w.wait = 10;
    const m = createMover(500);
    for (let i = 0; i < 60; i++) stepWander(w, m, FPS, { ...opts, rand: () => 0.5 });
    expect(m.x).toBe(500);
  });
});

describe('stepFollow', () => {
  const opts = { gap: 100, minX: 0, maxX: 2000, maxSpeed: 120, accel: 500 };

  test('catches up with a leader and then stays about a gap behind', () => {
    const leader = { x: 1000, dir: 1, depth: 0.5 };
    const m = createMover(100, 0.8);
    for (let i = 0; i < 60 * 30; i++) stepFollow(m, leader, FPS, opts);
    expect(leader.x - m.x).toBeGreaterThan(opts.gap * 0.6);
    expect(leader.x - m.x).toBeLessThan(opts.gap * 1.4);
    expect(m.vx).toBeCloseTo(0, 0);
  });

  test('moves into the leader\'s lane', () => {
    const leader = { x: 1000, dir: 1, depth: 0.2 };
    const m = createMover(900, 0.9);
    for (let i = 0; i < 60 * 10; i++) stepFollow(m, leader, FPS, { ...opts, depthOffset: 0.1 });
    expect(m.depth).toBeCloseTo(0.3, 1);
  });

  test('faces the leader once it has stopped', () => {
    const leader = { x: 1000, dir: 1, depth: 0.5 };
    const m = createMover(900);
    m.dir = -1;
    for (let i = 0; i < 60 * 20; i++) stepFollow(m, leader, FPS, opts);
    expect(m.dir).toBe(1);
  });

  test('stays inside the screen even if the leader is at the edge', () => {
    const leader = { x: 20, dir: 1, depth: 0.5 };
    const m = createMover(500);
    for (let i = 0; i < 60 * 30; i++) stepFollow(m, leader, FPS, { ...opts, minX: 50 });
    expect(m.x).toBeGreaterThanOrEqual(49);
  });

  test('sprints when far behind', () => {
    const leader = { x: 1900, dir: 1, depth: 0.5 };
    const m = createMover(0);
    let maxV = 0;
    for (let i = 0; i < 60 * 10; i++) {
      stepFollow(m, leader, FPS, opts);
      maxV = Math.max(maxV, Math.abs(m.vx));
    }
    expect(maxV).toBeGreaterThan(opts.maxSpeed);
  });
});

describe('tf', () => {
  test('builds a transform that rotates around a pivot', () => {
    expect(tf({ rot: 10, px: 5, py: 6 })).toBe(
      'translate(0 0) translate(5 6) rotate(10) scale(1 1) translate(-5 -6)'
    );
  });

  test('rounds long numbers so strings stay short', () => {
    expect(tf({ rot: 1.23456789 })).toContain('rotate(1.23)');
  });

  test('defaults to no change', () => {
    expect(tf()).toBe('translate(0 0) translate(0 0) rotate(0) scale(1 1) translate(0 0)');
  });
});

describe('createBlinker', () => {
  test('is open most of the time and blinks now and then, between 0 and 1', () => {
    const blink = createBlinker(seeded(4), [1, 2]);
    let blinks = 0;
    let wasClosed = false;
    let maxClosed = 0;
    for (let i = 0; i < 60 * 30; i++) {
      const c = blink.step(FPS);
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThanOrEqual(1);
      maxClosed = Math.max(maxClosed, c);
      const closed = c > 0.5;
      if (closed && !wasClosed) blinks++;
      wasClosed = closed;
    }
    expect(blinks).toBeGreaterThan(8);
    expect(blinks).toBeLessThan(31);
    expect(maxClosed).toBeGreaterThan(0.95);
  });
});

describe('createInterval', () => {
  test('fires about as often as the range says', () => {
    const timer = createInterval([2, 4], seeded(6));
    let fired = 0;
    for (let i = 0; i < 60 * 60; i++) if (timer.step(FPS)) fired++;
    expect(fired).toBeGreaterThanOrEqual(15);
    expect(fired).toBeLessThanOrEqual(30);
  });
});

describe('scene layout shared with the owl', () => {
  test('the owl tree exists and its tip is above its base', () => {
    expect(TREES[OWL_TREE]).toBeDefined();
    expect(treeTipVh(OWL_TREE)).toBeGreaterThan(treeBottomVh(OWL_TREE));
  });

  test('every tree stands near the back edge of the ground', () => {
    for (let i = 0; i < TREES.length; i++) {
      expect(treeBottomVh(i)).toBeGreaterThan(17);
      expect(treeBottomVh(i)).toBeLessThan(21);
    }
  });
});
