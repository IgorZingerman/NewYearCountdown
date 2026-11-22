/**
 * Rules for what characters say on their own (no DOM, so it can be tested).
 */

/** A remark about how long is left, or null if we don't know. */
export function countdownRemark(hoursLeft) {
  if (!Number.isFinite(hoursLeft) || hoursLeft < 0) return null;
  const days = Math.floor(hoursLeft / 24);
  if (hoursLeft >= 48) return `About ${days} days to go!`;
  if (hoursLeft >= 24) return 'Just one more day!';
  if (hoursLeft >= 2) return `Only ${hoursLeft} hours left!`;
  if (hoursLeft >= 1) return 'One hour to go!';
  return 'Minutes away!';
}

/**
 * Pick something to say from `lines`, never the same thing twice in a row.
 * Now and then (`remarkChance`) it picks the countdown `remark` instead.
 */
export function pickLine(lines, { remark = null, last = null, remarkChance = 0.25, rand = Math.random } = {}) {
  if (remark && rand() < remarkChance && remark !== last) return remark;
  const choices = lines.length > 1 ? lines.filter((l) => l !== last) : lines;
  return choices[Math.floor(rand() * choices.length)] ?? null;
}

/**
 * May a character speak right now? Only if it can be seen, and nobody else
 * spoke a moment ago (so the bubbles don't all pile up). Times are in seconds.
 */
export function canSpeak({ now, lastSpeechAt, minGap = 3, x, width, margin = 0.04 }) {
  const onScreen = x > width * margin && x < width * (1 - margin);
  return onScreen && now - lastSpeechAt >= minGap;
}

/** How long a bubble stays up, in milliseconds: longer for longer sentences. */
export function speechDuration(text) {
  return Math.min(4200, 1500 + text.length * 70);
}
