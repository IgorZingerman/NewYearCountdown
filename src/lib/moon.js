/**
 * Moon phase maths (no DOM, so it can be unit tested).
 *
 * Phase is a fraction of the ~29.5 day cycle:
 *   0    new moon
 *   0.25 first quarter (right half lit, northern hemisphere)
 *   0.5  full moon
 *   0.75 last quarter
 *
 * moonPhase() is the real moon, using the mean synodic month from a known new
 * moon (accurate to within about half a day). The site itself uses
 * moonPhaseForCountdown(), which is lined up so the moon is full at midnight.
 */

const SYNODIC_MONTH_DAYS = 29.530588853;
const MS_PER_DAY = 86400000;
// A known new moon: 6 January 2000, 18:14 UTC.
const REFERENCE_NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14);

/** Phase of the moon at `date`, from 0 (new) up to, but not including, 1. */
export function moonPhase(date = new Date()) {
  const cycles = (date.getTime() - REFERENCE_NEW_MOON_MS) / MS_PER_DAY / SYNODIC_MONTH_DAYS;
  return ((cycles % 1) + 1) % 1;
}

/**
 * Phase for the countdown: the moon waxes as New Year approaches and is full
 * at midnight. It moves at the real speed of the moon (one cycle per ~29.5
 * days), just lined up so the full moon lands on the target moment: roughly a
 * new moon 15 days out, a half moon a week out. After midnight it stays full.
 * Returns null if the target date is not valid.
 */
export function moonPhaseForCountdown(target, now = new Date()) {
  const targetMs = target instanceof Date ? target.getTime() : new Date(target).getTime();
  if (!Number.isFinite(targetMs)) return null;
  const remainingDays = Math.max(0, targetMs - now.getTime()) / MS_PER_DAY;
  const phase = 0.5 - remainingDays / SYNODIC_MONTH_DAYS;
  return ((phase % 1) + 1) % 1;
}

/** Share of the moon's face that is lit, from 0 to 1. */
export function moonIllumination(phase) {
  return (1 - Math.cos(2 * Math.PI * phase)) / 2;
}

/**
 * Shape of the lit part for drawing, in a unit circle (radius 1).
 *   waxing: true while the lit side is on the right (phase < 0.5)
 *   u: horizontal position of the terminator (the line between light and dark).
 *      |u| = 1 is a full moon, 0 is a half moon, and the sign says whether the
 *      lit area is bigger than half (u < 0 for gibbous phases on the right).
 */
export function moonGeometry(phase) {
  const waxing = phase < 0.5;
  const t = Math.cos(2 * Math.PI * phase);
  return { waxing, u: waxing ? t : -t };
}

const NAMES = [
  'New moon',
  'Waxing crescent',
  'First quarter',
  'Waxing gibbous',
  'Full moon',
  'Waning gibbous',
  'Last quarter',
  'Waning crescent',
];

/** Human name for a phase, e.g. "Waxing gibbous". */
export function moonPhaseName(phase) {
  return NAMES[Math.round(phase * 8) % 8];
}
