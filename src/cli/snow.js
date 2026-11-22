// Snow physics for the terminal version, kept apart from index.js so it can be tested.
//
// `speed` means the same here as on the website: the milliseconds an average flake takes to fall from
// the top of the screen to the bottom (bigger = slower).

export const SNOW_TICK_MS = 50; // how often the flakes move

export const DEFAULT_SNOW_SPEED = 4500; // the website's "normal"

// A new flake: a little faster or slower than average, drifting a little to the left or right.
export function createFlake(width, height, rand = Math.random) {
  return {
    x: Math.floor(rand() * width),
    y: Math.floor(rand() * height), // start at a random height
    pace: 0.7 + rand() * 0.6, // 0.7 to 1.3 times the average fall
    sway: (rand() - 0.5) * 0.5, // columns moved sideways for each row fallen (-0.25 to 0.25)
  };
}

// Where a flake is one tick later. A flake that leaves the bottom restarts above the top at a random column.
export function moveFlake(flake, { width, height, speed }, rand = Math.random) {
  const rowsPerTick = (height * SNOW_TICK_MS) / speed;
  const fall = rowsPerTick * flake.pace;

  let y = flake.y + fall;
  let x = flake.x + fall * flake.sway;

  if (y >= height) {
    y = -1;
    x = Math.floor(rand() * width);
  }

  // Wrap around the sides
  if (x < 0) x = width - 1;
  else if (x >= width) x = 0;

  return { ...flake, x, y };
}
