/**
 * The website's settings: what they are, their defaults, and how a saved
 * config is checked and stored. No DOM except localStorage, so it can be tested.
 *
 * (The terminal version has its own, separate config in src/cli/config.js.
 * Nothing on the settings page reaches it.)
 */

/**
 * ISO string for the next January 1st at midnight in the viewer's LOCAL time.
 * (Jan 1st of the current year has always already started, so this is always
 * Jan 1st of next year.)
 */
export function getNextNewYear(now = new Date()) {
  const next = new Date(now.getFullYear() + 1, 0, 1, 0, 0, 0, 0);
  return next.toISOString();
}

// Fonts the countdown can show. Each has its own look in CountdownDisplay.jsx.
export const VALID_FONTS = ['huge', 'slick', 'tiny', 'grid', 'block', 'simple', '3d'];

// Colours the digits can have (the hex values are in CountdownDisplay.jsx).
export const VALID_COLORS = ['cyan', 'magenta', 'yellow', 'blue', 'green', 'red', 'white', 'gray'];

// How much snow, as the density number Snowflakes.jsx expects (see lib/snow.js).
export const SNOW_AMOUNTS = { light: 20, normal: 40, heavy: 100 };

// How fast snow falls, as the milliseconds a flake takes to fall (bigger = slower).
export const SNOW_SPEEDS = { slow: 7000, normal: 4500, fast: 2800 };

function deepFreeze(value) {
  Object.values(value).forEach((v) => {
    if (v && typeof v === 'object') deepFreeze(v);
  });
  return Object.freeze(value);
}

/** A fresh copy of the default settings (safe to change). */
export function createDefaultConfig() {
  return {
    targetDate: getNextNewYear(),
    celebrationMessage: '🎉 Happy New Year! 🎉',
    font: { name: 'huge', rotate: false, rotationOptions: [...VALID_FONTS] },
    color: { value: 'cyan', rotate: true, rotationOptions: ['cyan', 'magenta', 'yellow', 'blue', 'green'] },
    snowflakes: { enabled: true, amount: 'normal', speed: 'normal' },
  };
}

// Frozen, so nothing can change the defaults by accident. Use createDefaultConfig() for a copy.
export const DEFAULT_CONFIG = deepFreeze(createDefaultConfig());

/** The `count` and `speed` numbers Snowflakes.jsx wants, for the snow settings. */
export function snowSettings(snowflakes) {
  return {
    count: SNOW_AMOUNTS[snowflakes?.amount] ?? SNOW_AMOUNTS.normal,
    speed: SNOW_SPEEDS[snowflakes?.speed] ?? SNOW_SPEEDS.normal,
  };
}

/** A level name from a stored value: the name itself, or (older saves stored numbers) the nearest level. */
function levelFrom(value, levels, fallback) {
  if (typeof value === 'string' && value in levels) return value;
  const n = Number(value);
  if (typeof value !== 'number' || !(n > 0)) return fallback;
  return Object.keys(levels).reduce((best, key) => (Math.abs(levels[key] - n) < Math.abs(levels[best] - n) ? key : best));
}

/** The items of `list` that are allowed, once each; `fallback` if none are. */
function onlyAllowed(list, allowed, fallback) {
  if (!Array.isArray(list)) return fallback;
  const kept = allowed.filter((item) => list.includes(item));
  return kept.length > 0 ? kept : fallback;
}

/**
 * Turn whatever was saved into a complete, valid config: anything missing or
 * not valid falls back to the default, and anything unknown is dropped.
 */
export function validateConfig(config) {
  const input = config && typeof config === 'object' ? config : {};
  const result = createDefaultConfig();

  if (input.targetDate && !isNaN(new Date(input.targetDate).getTime())) {
    result.targetDate = input.targetDate;
  }

  if (typeof input.celebrationMessage === 'string' && input.celebrationMessage.trim() !== '') {
    result.celebrationMessage = input.celebrationMessage;
  }

  const font = input.font ?? {};
  if (VALID_FONTS.includes(font.name)) result.font.name = font.name;
  if (typeof font.rotate === 'boolean') result.font.rotate = font.rotate;
  result.font.rotationOptions = onlyAllowed(font.rotationOptions, VALID_FONTS, result.font.rotationOptions);

  const color = input.color ?? {};
  if (VALID_COLORS.includes(color.value)) result.color.value = color.value;
  if (typeof color.rotate === 'boolean') result.color.rotate = color.rotate;
  result.color.rotationOptions = onlyAllowed(color.rotationOptions, VALID_COLORS, result.color.rotationOptions);

  const snow = input.snowflakes ?? {};
  if (typeof snow.enabled === 'boolean') result.snowflakes.enabled = snow.enabled;
  // Older saves stored a count and a speed in milliseconds: map them to the nearest level.
  result.snowflakes.amount = levelFrom(snow.amount ?? snow.count, SNOW_AMOUNTS, result.snowflakes.amount);
  result.snowflakes.speed = levelFrom(snow.speed, SNOW_SPEEDS, result.snowflakes.speed);

  return result;
}

/**
 * Load the saved settings from localStorage, or the defaults.
 */
export function loadConfig() {
  if (typeof window === 'undefined') {
    return createDefaultConfig();
  }

  try {
    const stored = localStorage.getItem('countdown-config');
    if (stored) {
      return validateConfig(JSON.parse(stored));
    }
  } catch (error) {
    console.error('Failed to load config from localStorage:', error);
  }

  return createDefaultConfig();
}

/**
 * Save the settings to localStorage and return what was saved.
 *
 * The target date is only remembered if the visitor picked something other
 * than "the next New Year": a remembered default would go stale once that New
 * Year has passed, and they would never see a new countdown.
 */
export function saveConfig(config) {
  const validated = validateConfig(config);
  if (typeof window === 'undefined') {
    return validated;
  }

  const isDefaultDate = new Date(validated.targetDate).getTime() === new Date(getNextNewYear()).getTime();
  const { targetDate, ...rest } = validated;

  try {
    localStorage.setItem('countdown-config', JSON.stringify(isDefaultDate ? rest : { targetDate, ...rest }));
  } catch (error) {
    console.error('Failed to save config to localStorage:', error);
    throw error;
  }
  return validated;
}
