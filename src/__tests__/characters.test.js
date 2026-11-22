/**
 * Tests for the logic behind the characters: lanes (world.js), walking and
 * following (wander.js) and posing helpers (pose.js). They import the real code.
 */
import { ground, createWorld, FOOT_BACK_VH, FOOT_FRONT_VH } from '../lib/world';
import {
  brake,
  createMover,
  createWanderer,
  moveToward,
  stepFollow,
  stepWander,
} from '../lib/wander';
import { createBlinker, createInterval, tf } from '../lib/pose';
import { OWL_START_PERCH, PERCHES, TREES, perchSpot, treeBottomVh, treeTipVh } from '../lib/scene';
import { JOKES, canSpeak, countdownRemark, jokeGap, pickJoke, pickLine, speechDuration } from '../lib/chatter';
import { flightDuration, flightPoint, pickPerch } from '../lib/flight';

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
  test('the owl perches only on unlit trees and starts on a valid one', () => {
    expect(PERCHES.length).toBeGreaterThanOrEqual(3);
    for (const tree of PERCHES) expect(TREES[tree].lit).toBeFalsy();
    expect(OWL_START_PERCH).toBeGreaterThanOrEqual(0);
    expect(OWL_START_PERCH).toBeLessThan(PERCHES.length);
  });

  test('each perch is at the tip of its tree and follows the screen width', () => {
    for (let p = 0; p < PERCHES.length; p++) {
      const tree = PERCHES[p];
      const wide = perchSpot(p, 2000);
      const narrow = perchSpot(p, 1000);
      expect(wide.vh).toBeGreaterThan(treeBottomVh(tree));
      expect(wide.vh).toBeLessThan(treeTipVh(tree));
      expect(wide.x).toBeCloseTo(narrow.x * 2, 6);
    }
  });

  test('every tree stands near the back edge of the ground', () => {
    for (let i = 0; i < TREES.length; i++) {
      expect(treeBottomVh(i)).toBeGreaterThan(17);
      expect(treeBottomVh(i)).toBeLessThan(21);
    }
  });
});

describe('createWorld', () => {
  test('starts with nobody having spoken and no countdown known', () => {
    const world = createWorld();
    expect(world.hoursLeft).toBeNull();
    expect(world.lastSpeechAt).toBe(-Infinity);
    expect(world.joke).toBeNull();
    expect(world.yeti).toBeDefined();
  });

  test('remembers the hours left', () => {
    const world = createWorld();
    world.setHoursLeft(42);
    expect(world.hoursLeft).toBe(42);
  });
});

describe('walking off-screen', () => {
  const W = 1400;
  const edge = { chance: 1, left: -100, right: W + 100, awayRange: [3, 4] };
  const opts = { minX: 100, maxX: 1300, maxSpeed: 150, accel: 600, idleRange: [0.3, 0.6], slowRadius: 100, edge };

  test('leaves the screen, stays out of sight for a while, then comes back', () => {
    const rand = seeded(5);
    const w = createWanderer(rand);
    const m = createMover(700);
    let wasOffscreen = false;
    let returned = false;
    let offscreenFrames = 0;
    for (let i = 0; i < 60 * 90 && !returned; i++) {
      stepWander(w, m, FPS, { ...opts, edge: { ...edge, chance: wasOffscreen ? 0 : 1 }, rand });
      const out = m.x < 0 || m.x > W;
      if (out) {
        wasOffscreen = true;
        offscreenFrames++;
      } else if (wasOffscreen) {
        returned = true;
      }
    }
    expect(wasOffscreen).toBe(true);
    expect(returned).toBe(true);
    // It really did stay away for a few seconds (awayRange is 3 to 4 s)
    expect(offscreenFrames / 60).toBeGreaterThan(2.5);
  });

  test('walks all the way out at pace instead of slowing down at the edge', () => {
    const rand = seeded(2);
    const w = createWanderer(rand);
    const m = createMover(1200);
    w.wait = 0;
    let slowestAtEdge = Infinity;
    let left = false;
    for (let i = 0; i < 60 * 30 && !left; i++) {
      stepWander(w, m, FPS, { ...opts, rand });
      if (m.x > W - 150 && m.x < W && w.leaving) slowestAtEdge = Math.min(slowestAtEdge, Math.abs(m.vx));
      if (m.x > W) left = true;
    }
    expect(left).toBe(true);
    expect(slowestAtEdge).toBeGreaterThan(40);
  });

  test('without an edge option it never goes off-screen', () => {
    const rand = seeded(9);
    const w = createWanderer(rand);
    const m = createMover(700);
    for (let i = 0; i < 60 * 120; i++) {
      stepWander(w, m, FPS, { ...opts, edge: null, rand });
      expect(m.x).toBeGreaterThanOrEqual(opts.minX - 5);
      expect(m.x).toBeLessThanOrEqual(opts.maxX + 5);
    }
  });

  test('it is not talking or walking while hidden, and it faces inwards when it returns', () => {
    const rand = seeded(11);
    const w = createWanderer(rand);
    const m = createMover(1250);
    w.mode = 'idle';
    w.wait = 0;
    // Pretend it is already waiting off the right edge
    m.x = W + 100;
    w.offscreen = true;
    w.wait = 0;
    stepWander(w, m, FPS, { ...opts, edge: { ...edge, chance: 0 }, rand: () => 0.9 }); // 0.9: stays on the same side
    expect(w.mode).toBe('walk');
    expect(m.dir).toBe(-1);
    expect(w.offscreen).toBe(false);
  });
});

describe('countdownRemark', () => {
  test('talks in days, then a day, hours, an hour, and minutes', () => {
    expect(countdownRemark(961)).toBe('About 40 days to go!');
    expect(countdownRemark(48)).toBe('About 2 days to go!');
    expect(countdownRemark(30)).toBe('Just one more day!');
    expect(countdownRemark(5)).toBe('Only 5 hours left!');
    expect(countdownRemark(1)).toBe('One hour to go!');
    expect(countdownRemark(0)).toBe('Minutes away!');
  });

  test('says nothing when it does not know', () => {
    expect(countdownRemark(null)).toBeNull();
    expect(countdownRemark(undefined)).toBeNull();
    expect(countdownRemark(NaN)).toBeNull();
    expect(countdownRemark(-3)).toBeNull();
  });
});

describe('pickLine', () => {
  const lines = ['a', 'b', 'c'];

  test('never repeats the previous line', () => {
    const rand = seeded(1);
    let last = null;
    for (let i = 0; i < 200; i++) {
      const line = pickLine(lines, { last, rand });
      expect(line).not.toBe(last);
      last = line;
    }
  });

  test('uses every line eventually', () => {
    const rand = seeded(2);
    const seen = new Set();
    for (let i = 0; i < 100; i++) seen.add(pickLine(lines, { rand }));
    expect(seen).toEqual(new Set(lines));
  });

  test('sometimes picks the countdown remark, and not when there is none', () => {
    const rand = seeded(3);
    const withRemark = Array.from({ length: 200 }, () => pickLine(lines, { remark: 'R', rand }));
    const count = withRemark.filter((l) => l === 'R').length;
    expect(count).toBeGreaterThan(20);
    expect(count).toBeLessThan(90);
    expect(Array.from({ length: 50 }, () => pickLine(lines, { remark: null, rand })).includes('R')).toBe(false);
  });

  test('a single line is allowed to repeat, and an empty list says nothing', () => {
    expect(pickLine(['only'], { last: 'only' })).toBe('only');
    expect(pickLine([])).toBeNull();
  });
});

describe('canSpeak', () => {
  const base = { now: 100, lastSpeechAt: 0, x: 500, width: 1000 };

  test('speaks when visible and the room is quiet', () => {
    expect(canSpeak(base)).toBe(true);
  });

  test('waits while someone else spoke a moment ago', () => {
    expect(canSpeak({ ...base, lastSpeechAt: 99 })).toBe(false);
    expect(canSpeak({ ...base, lastSpeechAt: 96 })).toBe(true);
  });

  test('stays quiet when off-screen or right at the edge', () => {
    expect(canSpeak({ ...base, x: -50 })).toBe(false);
    expect(canSpeak({ ...base, x: 1050 })).toBe(false);
    expect(canSpeak({ ...base, x: 20 })).toBe(false);
  });

  test('nobody has spoken yet', () => {
    expect(canSpeak({ ...base, lastSpeechAt: -Infinity })).toBe(true);
  });
});

describe('speechDuration', () => {
  test('longer sentences stay up longer, within limits', () => {
    expect(speechDuration('Hi!')).toBeLessThan(speechDuration('Any New Year resolutions this year?'));
    expect(speechDuration('x'.repeat(500))).toBeLessThanOrEqual(4200);
    expect(speechDuration('')).toBeGreaterThanOrEqual(1500);
  });
});

describe('owl flight', () => {
  const from = { x: 200, vh: 30 };
  const to = { x: 1000, vh: 35 };

  test('flights take longer for longer trips, within limits', () => {
    expect(flightDuration(100, 1400)).toBe(1);
    expect(flightDuration(1000, 1400)).toBeGreaterThan(flightDuration(700, 1400));
    expect(flightDuration(5000, 1400)).toBe(3);
  });

  test('starts on the first perch and ends on the second', () => {
    const start = flightPoint(from, to, 0, 1400);
    const end = flightPoint(from, to, 1, 1400);
    expect(start.x).toBeCloseTo(from.x, 6);
    expect(start.vh).toBeCloseTo(from.vh, 6);
    expect(end.x).toBeCloseTo(to.x, 6);
    expect(end.vh).toBeCloseTo(to.vh, 6);
  });

  test('arcs up over the trip and always moves the same way', () => {
    let lastX = -Infinity;
    let peak = 0;
    for (let u = 0; u <= 1.0001; u += 0.05) {
      const p = flightPoint(from, to, u, 1400);
      expect(p.x).toBeGreaterThanOrEqual(lastX);
      lastX = p.x;
      peak = Math.max(peak, p.vh - lerpLine(from.vh, to.vh, (p.x - from.x) / (to.x - from.x)));
    }
    expect(peak).toBeGreaterThan(3);
  });

  test('is slow at the ends and fast in the middle', () => {
    const early = flightPoint(from, to, 0.05, 1400).x - from.x;
    const middle = flightPoint(from, to, 0.55, 1400).x - flightPoint(from, to, 0.5, 1400).x;
    expect(middle).toBeGreaterThan(early);
  });

  test('never picks the perch it is already on', () => {
    const rand = seeded(7);
    const seen = new Set();
    for (let i = 0; i < 300; i++) {
      const next = pickPerch(5, 2, rand);
      expect(next).not.toBe(2);
      expect(next).toBeGreaterThanOrEqual(0);
      expect(next).toBeLessThan(5);
      seen.add(next);
    }
    expect(seen).toEqual(new Set([0, 1, 3, 4]));
  });

  test('with a single perch it stays put', () => {
    expect(pickPerch(1, 0)).toBe(0);
  });
});

function lerpLine(a, b, t) {
  return a + (b - a) * t;
}

describe('jokes', () => {
  test('every joke is short enough for a bubble, and never empty', () => {
    for (const joke of JOKES) {
      expect(joke.length).toBeGreaterThanOrEqual(2);
      for (const line of joke) {
        expect(line.length).toBeGreaterThan(0);
        expect(line.length).toBeLessThanOrEqual(45); // a bubble stays readable on a phone
      }
    }
  });

  test('knock-knock jokes follow the knock-knock pattern', () => {
    const knockKnocks = JOKES.filter((joke) => joke[0] === 'Knock knock!');
    expect(knockKnocks.length).toBeGreaterThan(0);
    for (const [, whoIs, name, whoName] of knockKnocks) {
      expect(whoIs).toBe("Who's there?");
      expect(whoName).toBe(`${name.replace(/\.$/, '')} who?`);
    }
  });

  test('pickJoke returns one of the jokes, and can reach every one', () => {
    expect(pickJoke(() => 0)).toBe(JOKES[0]);
    expect(pickJoke(() => 0.999999)).toBe(JOKES[JOKES.length - 1]);
    const seen = new Set();
    for (let i = 0; i < 500; i++) seen.add(pickJoke());
    expect(seen.size).toBe(JOKES.length);
  });

  test('jokeGap waits long enough to read a line, and never less than the speech gap', () => {
    expect(jokeGap('Boo.')).toBeGreaterThanOrEqual(3.2);
    expect(jokeGap('x'.repeat(200))).toBeGreaterThan(jokeGap('Boo.'));
    expect(jokeGap('x'.repeat(200))).toBeLessThanOrEqual(4.8);
  });
});
