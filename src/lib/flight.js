/**
 * Flight paths for a bird hopping between perches (no DOM, so it can be tested).
 * A perch is { x, vh }: x in pixels, vh = height above the bottom of the
 * screen in percent of its height.
 */

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** Seconds a flight takes: longer for longer trips, never too quick or slow. */
export function flightDuration(distancePx, screenWidth) {
  return clamp(distancePx / (screenWidth * 0.45), 1, 3);
}

/**
 * Where the bird is a fraction `u` (0..1) of the way through a flight from
 * `from` to `to`: eased at both ends, and arcing up over the trip.
 */
export function flightPoint(from, to, u, screenWidth) {
  const e = -(Math.cos(Math.PI * clamp(u, 0, 1)) - 1) / 2; // slow, fast, slow
  const trip = Math.abs(to.x - from.x) / screenWidth;
  const arc = 4 + trip * 14; // vh of extra height at the top of the arc
  return {
    x: lerp(from.x, to.x, e),
    vh: lerp(from.vh, to.vh, e) + arc * Math.sin(Math.PI * clamp(u, 0, 1)),
  };
}

/** Choose the next perch: any one except the current. Returns an index into `perches`. */
export function pickPerch(count, current, rand = Math.random) {
  if (count < 2) return current;
  let next = Math.floor(rand() * (count - 1));
  if (next >= current) next += 1;
  return next;
}
