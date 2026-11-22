/**
 * Shared layout of the scenery, so things that sit on the scenery (like the
 * owl on its tree) agree with where the scenery draws them.
 */

// Pine trees along the horizon: x (% of width), height (vh) and whether lit.
export const TREES = [
  { x: 4, h: 25, lit: true },
  { x: 13, h: 16 },
  { x: 21, h: 12 },
  { x: 33, h: 10 },
  { x: 63, h: 11 },
  { x: 74, h: 15 },
  { x: 85, h: 24, lit: true },
  { x: 94, h: 17 },
];

/** Bottom edge of tree i, in vh above the bottom of the screen. */
export function treeBottomVh(i) {
  return 19.5 - (i % 3) * 0.8;
}

/** Height of tree i's tip, in vh above the bottom of the screen. */
export function treeTipVh(i) {
  // The tree art's tip is at y=4 of 100, i.e. 96% of the way up.
  return treeBottomVh(i) + TREES[i].h * 0.96;
}

// The owl perches on the tip of this tree (an unlit one on the right).
export const OWL_TREE = 5;
