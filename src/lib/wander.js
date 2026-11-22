/**
 * Movement for characters walking along the ground (no DOM, so it can be
 * tested). Everything is in screen pixels, with x being the character's centre.
 *
 * A "mover" is { x, vx, dir, depth }: position, velocity, which way it faces
 * (1 = right, -1 = left) and which lane it is in (see world.js).
 */

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function createMover(x, depth = 0.5) {
  return { x, vx: 0, dir: 1, depth };
}

/** Slow down smoothly to a stop (used while a character is idle). */
export function brake(m, dt, accel) {
  m.vx -= clamp(m.vx, -accel * dt, accel * dt);
  m.x += m.vx * dt;
  return m;
}

/**
 * Walk towards `targetX`: speed up to maxSpeed, then ease off in the last
 * `slowRadius` pixels. Returns true once arrived (and snaps to the target).
 */
export function moveToward(m, targetX, dt, { maxSpeed, accel, slowRadius = 120 }) {
  const dx = targetX - m.x;
  if (Math.abs(dx) < 3 && Math.abs(m.vx) < 30) {
    m.x = targetX;
    m.vx = 0;
    return true;
  }
  // Never creep slower than this, or the last few pixels take forever.
  const creep = Math.min(maxSpeed, 30);
  const want = Math.sign(dx) * Math.max(creep, maxSpeed * Math.min(1, Math.abs(dx) / slowRadius));
  m.vx += clamp(want - m.vx, -accel * dt, accel * dt);
  m.x += m.vx * dt;
  if (Math.abs(m.vx) > 8) m.dir = Math.sign(m.vx);
  return false;
}

/** State for a character that wanders: rests a bit, then walks somewhere new. */
export function createWanderer(rand = Math.random) {
  return {
    mode: 'idle', // 'idle' | 'walk'
    wait: 0.5 + rand() * 2,
    targetX: 0,
    targetDepth: 0.5,
    tripLen: 0,
    leaving: false, // walking off-screen
    offscreen: false, // currently out of sight, waiting to come back
  };
}

/**
 * Advance a wanderer by dt. Returns true while it is walking.
 * opts: { minX, maxX, maxSpeed, accel, rand, idleRange, minTrip, slowRadius, edge }
 *
 * `edge` is optional and lets the character wander off-screen now and then:
 *   { chance, left, right, awayRange }
 * `chance` is the odds that a trip heads off-screen, `left` and `right` are x
 * positions just outside the screen, and `awayRange` is how many seconds it
 * stays out of sight. When it comes back it may re-enter from the other side.
 */
export function stepWander(w, m, dt, opts) {
  const {
    minX,
    maxX,
    maxSpeed,
    accel,
    rand = Math.random,
    idleRange = [1.5, 5],
    minTrip = 150,
    slowRadius = 120,
    edge = null,
  } = opts;

  if (w.mode === 'idle') {
    brake(m, dt, accel);
    w.wait -= dt;
    if (w.wait <= 0) {
      if (w.offscreen) {
        // Coming back. While out of sight it may switch sides, then walks in.
        if (edge && rand() < 0.5) m.x = m.x < minX ? edge.right : edge.left;
        m.vx = 0;
        m.dir = m.x < minX ? 1 : -1;
        w.offscreen = false;
      }
      let target;
      if (edge && !w.offscreen && m.x >= minX - 1 && m.x <= maxX + 1 && rand() < edge.chance) {
        // Head off-screen through either edge.
        target = rand() < 0.5 ? edge.left : edge.right;
        w.leaving = true;
      } else {
        // Pick somewhere that is worth walking to, if the room allows it.
        target = lerp(minX, maxX, rand());
        for (let i = 0; i < 6 && Math.abs(target - m.x) < minTrip; i++) {
          target = lerp(minX, maxX, rand());
        }
      }
      w.targetX = target;
      w.tripLen = Math.abs(target - m.x);
      w.targetDepth = lerp(0.15, 0.95, rand());
      w.mode = 'walk';
    }
    return false;
  }

  // Don't ease off near an off-screen target: it should walk out of sight at pace.
  const arrived = moveToward(m, w.targetX, dt, {
    maxSpeed,
    accel,
    slowRadius: w.leaving ? 20 : slowRadius,
  });
  // Drift between lanes while walking, so paths cross naturally.
  const maxDrift = 0.1 * dt;
  m.depth += clamp(w.targetDepth - m.depth, -maxDrift, maxDrift);
  if (arrived) {
    w.mode = 'idle';
    if (w.leaving && edge) {
      w.leaving = false;
      w.offscreen = true;
      const away = edge.awayRange ?? [6, 18];
      w.wait = lerp(away[0], away[1], rand());
    } else {
      w.wait = lerp(idleRange[0], idleRange[1], rand());
    }
    return false;
  }
  return true;
}

/**
 * Follow a leader, staying `gap` px behind it (on whichever side is behind).
 * Rests when close enough and then looks at the leader. Returns true while
 * walking.
 * opts: { gap, minX, maxX, maxSpeed, accel, depthOffset }
 */
export function stepFollow(m, leader, dt, opts) {
  const { gap, minX, maxX, maxSpeed, accel, depthOffset = 0.1 } = opts;
  const target = clamp(leader.x - leader.dir * gap, minX, maxX);
  const dist = Math.abs(target - m.x);

  // Ease into the leader's lane.
  m.depth += (clamp(leader.depth + depthOffset, 0, 1) - m.depth) * Math.min(1, dt * 1.2);

  // Close enough: stand and watch the leader instead of chasing tiny differences.
  if (dist < gap * 0.35) {
    brake(m, dt, accel);
    if (Math.abs(m.vx) < 8) m.dir = Math.sign(leader.x - m.x) || m.dir;
    return Math.abs(m.vx) > 8;
  }

  // Sprint when far behind.
  const cap = dist > gap * 3 ? maxSpeed * 1.7 : maxSpeed;
  moveToward(m, target, dt, { maxSpeed: cap, accel, slowRadius: gap });
  return true;
}
