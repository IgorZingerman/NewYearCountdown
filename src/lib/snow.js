/**
 * Pure helpers for the canvas snow (no DOM, so they can be unit tested).
 *
 * The idea: every flake has a "depth" z from 0 (far away) to 1 (close to the
 * camera). Depth drives everything, so the field reads as 3D:
 *   far  -> small, slow, faint, barely pushed by wind, lands on the far ground
 *   near -> big, fast, bright, pushed hard by wind, falls to the screen bottom
 */

export const MAX_FLAKES = 1000;

// Where the ground begins, as a fraction of the viewport height (from the top).
// Far flakes "land" here; near flakes fall past it to the bottom of the screen.
export const HORIZON = 0.8;

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const smoothstep = (t) => t * t * (3 - 2 * t);

/**
 * How many flakes to draw. `count` is the (legacy) setting, 1..200, and acts as
 * a density: the default of 40 gives a gentle snowfall (~240 flakes) on a 1440x900 screen.
 * Smaller screens get proportionally fewer so phones are not overloaded.
 */
export function flakeCount(count, width, height, reducedMotion = false) {
  const base = clamp(Number(count) || 0, 0, 200) * 6;
  const area = (width * height) / (1440 * 900);
  let n = Math.round(base * clamp(area, 0.35, 1.5));
  if (reducedMotion) n = Math.round(n * 0.4);
  return clamp(n, 0, MAX_FLAKES);
}

/**
 * Fall-speed multiplier from the legacy `speed` setting. That value used to be
 * "milliseconds to fall", so bigger meant slower. 4500 is the default (1x).
 */
export function speedScale(speed) {
  const s = Number(speed);
  if (!(s > 0)) return 1;
  return clamp(4500 / s, 0.3, 3);
}

/**
 * Create one flake. `rand` is injectable for tests. If `anywhere` is true the
 * flake starts at a random height (initial fill); otherwise just above the top.
 */
export function createFlake(width, height, rand = Math.random, anywhere = true) {
  // Squaring biases towards far flakes: lots of tiny ones, a few big ones.
  const z = Math.pow(rand(), 1.6);
  const crystal = z > 0.55 && rand() < 0.22;
  const radius = lerp(0.8, 3.4, z);
  return {
    x: rand() * width,
    y: anywhere ? rand() * height : -radius * 4 - rand() * 60,
    z,
    radius,
    vy: lerp(26, 105, z) * (0.85 + rand() * 0.3),
    alpha: lerp(0.3, 0.95, z) * (0.8 + rand() * 0.2),
    // Each flake sways on its own sine wave, so they never move in lockstep.
    swayPhase: rand() * Math.PI * 2,
    swayFreq: lerp(0.6, 1.8, rand()),
    swayAmp: lerp(5, 20, rand()) * lerp(0.5, 1, z),
    crystal,
    angle: rand() * Math.PI * 2,
    spin: crystal ? (rand() - 0.5) * 0.9 : 0,
    // Y (in px) at which this flake lands/fades; depends on depth.
    landY: lerp(height * HORIZON, height + 12, z),
    fade: 1,
  };
}

/**
 * A wind generator: a faint constant breeze plus occasional gusts that ease in
 * and out. Returns an object with `step(dt)` which gives the current wind in
 * px/s (positive = to the right).
 */
export function createWind(rand = Math.random, enabled = true) {
  let t = 0;
  let nextGustIn = 3 + rand() * 5;
  let gust = null; // { age, duration, strength }
  const phase = rand() * 100;

  return {
    step(dt) {
      if (!enabled) return 0;
      t += dt;
      nextGustIn -= dt;
      if (!gust && nextGustIn <= 0) {
        const direction = rand() < 0.5 ? -1 : 1;
        gust = {
          age: 0,
          duration: 3 + rand() * 3,
          strength: direction * (45 + rand() * 55),
        };
      }
      // Slow, always-on breeze from two out-of-phase sines.
      let wind = Math.sin(t * 0.21 + phase) * 9 + Math.sin(t * 0.07 + phase * 2) * 7;
      if (gust) {
        gust.age += dt;
        const p = gust.age / gust.duration;
        if (p >= 1) {
          gust = null;
          nextGustIn = 6 + rand() * 9;
        } else {
          // Rises then falls: sin(pi * p) shaped with smoothstep for softness.
          const envelope = smoothstep(Math.sin(Math.PI * p));
          wind += gust.strength * envelope;
        }
      }
      return wind;
    },
  };
}

/**
 * Advance one flake by `dt` seconds. Mutates and returns the flake.
 * `time` is elapsed seconds (drives the sway), `wind` is px/s from createWind.
 * Returns the same flake; `flake.dead` is set when it has finished landing.
 */
export function stepFlake(flake, dt, time, wind, speed, width) {
  // Closer flakes feel the wind more than far ones.
  const windFactor = 0.25 + flake.z * 0.75;
  const sway = Math.sin(time * flake.swayFreq + flake.swayPhase) * flake.swayAmp;
  flake.x += (wind * windFactor + sway) * dt;
  flake.y += flake.vy * speed * dt;
  flake.angle += flake.spin * dt;

  // Wrap sideways so wind never empties one side of the screen.
  const margin = flake.radius * 6;
  if (flake.x < -margin) flake.x += width + margin * 2;
  else if (flake.x > width + margin) flake.x -= width + margin * 2;

  // Fade out over the last stretch before landing instead of popping away.
  const fadeZone = 26;
  flake.fade = clamp((flake.landY - flake.y) / fadeZone, 0, 1);
  flake.dead = flake.y >= flake.landY;
  return flake;
}
