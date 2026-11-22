/**
 * Small helpers for posing SVG characters (no DOM, so they can be tested).
 */

const lerp = (a, b, t) => a + (b - a) * t;

// Short, stable number formatting so transform strings stay small.
const f = (n) => Number(n.toFixed(2));

/**
 * Build an SVG transform string: move by (x, y), then rotate and scale around
 * the pivot (px, py). Use it for limbs that swing from a joint.
 */
export function tf({ x = 0, y = 0, rot = 0, px = 0, py = 0, sx = 1, sy = 1 } = {}) {
  return `translate(${f(x)} ${f(y)}) translate(${f(px)} ${f(py)}) rotate(${f(rot)}) scale(${f(sx)} ${f(sy)}) translate(${f(-px)} ${f(-py)})`;
}

/**
 * Blinking. Call step(dt) every frame: it returns how closed the eyes are,
 * from 0 (open) to 1 (shut), and blinks at random intervals.
 */
export function createBlinker(rand = Math.random, gap = [2, 6]) {
  const BLINK_SECONDS = 0.16;
  let wait = lerp(gap[0], gap[1], rand());
  let t = -1; // -1 means "not blinking"
  return {
    step(dt) {
      if (t < 0) {
        wait -= dt;
        if (wait <= 0) t = 0;
        return 0;
      }
      t += dt;
      if (t >= BLINK_SECONDS) {
        t = -1;
        wait = lerp(gap[0], gap[1], rand());
        return 0;
      }
      return Math.sin((Math.PI * t) / BLINK_SECONDS);
    },
  };
}

/**
 * A repeating timer: step(dt) returns true each time a random number of
 * seconds within `range` has passed. `first` is the range for the very first
 * wait (defaults to `range`).
 */
export function createInterval(range, rand = Math.random, first = range) {
  let left = lerp(first[0], first[1], rand());
  return {
    step(dt) {
      left -= dt;
      if (left > 0) return false;
      left = lerp(range[0], range[1], rand());
      return true;
    },
  };
}
