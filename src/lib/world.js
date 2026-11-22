/**
 * Where characters stand on the snowy ground (no DOM, so it can be tested).
 *
 * The ground is a strip across the bottom of the screen. A character's
 * "depth" says which lane it walks in:
 *   0 = back lane: higher on screen, smaller, drawn behind
 *   1 = front lane: lower on screen, bigger, drawn in front
 * This gives a cheap 3D feel: characters can pass in front of and behind each
 * other.
 */

// Feet position, as a percentage of the screen height measured from the bottom.
export const FOOT_BACK_VH = 15;
export const FOOT_FRONT_VH = 4.5;

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/**
 * Screen placement for a lane. `z` stays between 6 and 9: above the fireworks
 * (5) and the scenery, below the snow (10).
 */
export function ground(depth) {
  const d = clamp(depth, 0, 1);
  return {
    bottomVh: lerp(FOOT_BACK_VH, FOOT_FRONT_VH, d),
    scale: lerp(0.72, 1.06, d),
    z: 6 + Math.round(d * 3),
  };
}

/**
 * State shared by all characters, so they can react to each other and to the
 * countdown. Created once by <Characters />.
 */
export function createWorld() {
  return {
    yeti: { x: 0, dir: 1, depth: 0.5, moving: false }, // the cub follows him
    hoursLeft: null, // lets them remark on how long is left
    lastSpeechAt: -Infinity, // seconds; so only one of them talks at a time
    joke: null, // the joke being told: { steps, index, due } (see chatter.js)
    setHoursLeft(hours) {
      this.hoursLeft = hours;
    },
  };
}
