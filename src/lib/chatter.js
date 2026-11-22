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

/**
 * Jokes, as the lines said in order. Each line can be said by any character
 * (whoever is free next), so a joke can be a little exchange between friends.
 * One-liners are a question and its answer.
 */
export const JOKES = [
  ['Knock knock!', "Who's there?", 'Boo.', 'Boo who?', "Don't cry, it's only a joke!"],
  ['Knock knock!', "Who's there?", 'Lettuce.', 'Lettuce who?', 'Lettuce in, I am freezing!'],
  ['Knock knock!', "Who's there?", 'Ice.', 'Ice who?', 'Ice to meet you!'],
  ['Knock knock!', "Who's there?", 'Snow.', 'Snow who?', "Snow use, I'm freezing!"],
  ['Knock knock!', "Who's there?", 'Doughnut.', 'Doughnut who?', 'Doughnut open this door, it is cold!'],
  ['What do snowmen eat for breakfast?', 'Frosted flakes!'],
  ['What do you call a penguin in the desert?', 'Lost!'],
  ["What's a yeti's favourite dessert?", 'Abominable pie!'],
  ['What do you call a bear with no teeth?', 'A gummy bear!'],
  ['Why was the owl bad at tests?', "It didn't give a hoot!"],
  ['What do you call a snowman in summer?', 'A puddle!'],
];

/** Chance that a character starts a joke, rather than a plain remark, when it speaks. */
export const JOKE_CHANCE = 0.25;

/** One joke: the list of lines, picked at random. */
export function pickJoke(rand = Math.random) {
  return JOKES[Math.floor(rand() * JOKES.length)];
}

/**
 * Seconds to wait before the next line of a joke, so the bubble has been read
 * and the next one doesn't replace it. Always more than canSpeak's gap.
 */
export function jokeGap(text) {
  return Math.max(3.2, speechDuration(text) / 1000 + 0.5);
}
