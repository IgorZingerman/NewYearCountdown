/**
 * Tests for the website's settings (src/lib/config.js and src/lib/dateInput.js).
 * These import the real code.
 */
import { jest } from '@jest/globals';
import {
  DEFAULT_CONFIG,
  SNOW_AMOUNTS,
  SNOW_SPEEDS,
  VALID_COLORS,
  VALID_FONTS,
  createDefaultConfig,
  getNextNewYear,
  loadConfig,
  saveConfig,
  snowSettings,
  validateConfig,
} from '../lib/config';
import { datePresets, fromDateTimeLocal, toDateTimeLocal } from '../lib/dateInput';

function fakeLocalStorage() {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
  };
}

beforeEach(() => {
  global.window = {};
  global.localStorage = fakeLocalStorage();
});

afterEach(() => {
  delete global.window;
  delete global.localStorage;
  jest.restoreAllMocks();
});

describe('defaults', () => {
  test('are complete and use only values the settings page offers', () => {
    const config = createDefaultConfig();
    expect(VALID_FONTS).toContain(config.font.name);
    expect(VALID_COLORS).toContain(config.color.value);
    config.font.rotationOptions.forEach((font) => expect(VALID_FONTS).toContain(font));
    config.color.rotationOptions.forEach((color) => expect(VALID_COLORS).toContain(color));
    expect(SNOW_AMOUNTS).toHaveProperty(config.snowflakes.amount);
    expect(SNOW_SPEEDS).toHaveProperty(config.snowflakes.speed);
    expect(new Date(config.targetDate).getTime()).toBeGreaterThan(Date.now());
  });

  test('every font is a different look, and none is the removed placeholder names', () => {
    expect(new Set(VALID_FONTS).size).toBe(VALID_FONTS.length);
    ['pallet', 'shade', 'simpleBlock', 'simple3d', 'chrome'].forEach((name) => expect(VALID_FONTS).not.toContain(name));
  });

  test('createDefaultConfig returns a fresh copy each time', () => {
    const a = createDefaultConfig();
    a.font.name = 'tiny';
    a.color.rotationOptions.push('red');
    expect(createDefaultConfig().font.name).toBe(DEFAULT_CONFIG.font.name);
    expect(createDefaultConfig().color.rotationOptions).toEqual(DEFAULT_CONFIG.color.rotationOptions);
  });

  test('DEFAULT_CONFIG cannot be changed', () => {
    expect(() => {
      DEFAULT_CONFIG.font.name = 'tiny';
    }).toThrow();
    expect(() => {
      DEFAULT_CONFIG.color.rotationOptions.push('red');
    }).toThrow();
  });
});

describe('validateConfig', () => {
  test('returns the defaults for nothing, or for rubbish', () => {
    [undefined, null, 'text', 42, [], {}].forEach((input) => {
      expect(validateConfig(input)).toEqual(createDefaultConfig());
    });
  });

  test('never changes the defaults, even when given custom settings', () => {
    validateConfig({ font: { name: 'tiny', rotate: true, rotationOptions: ['tiny'] }, color: { value: 'red' } });
    expect(createDefaultConfig().font.name).toBe('huge');
    expect(DEFAULT_CONFIG.font.name).toBe('huge');
    expect(DEFAULT_CONFIG.color.value).toBe('cyan');
  });

  test('keeps a valid target date, and ignores an invalid one', () => {
    expect(validateConfig({ targetDate: '2030-06-01T12:00:00.000Z' }).targetDate).toBe('2030-06-01T12:00:00.000Z');
    expect(validateConfig({ targetDate: 'not a date' }).targetDate).toBe(DEFAULT_CONFIG.targetDate);
  });

  test('keeps a custom message, but not a blank one', () => {
    expect(validateConfig({ celebrationMessage: 'Cheers!' }).celebrationMessage).toBe('Cheers!');
    expect(validateConfig({ celebrationMessage: '   ' }).celebrationMessage).toBe(DEFAULT_CONFIG.celebrationMessage);
    expect(validateConfig({ celebrationMessage: 5 }).celebrationMessage).toBe(DEFAULT_CONFIG.celebrationMessage);
  });

  test('accepts only known fonts and colours', () => {
    expect(validateConfig({ font: { name: 'slick' } }).font.name).toBe('slick');
    expect(validateConfig({ font: { name: 'chrome' } }).font.name).toBe('huge'); // a font that no longer exists
    expect(validateConfig({ font: { name: 'nope' } }).font.name).toBe('huge');
    expect(validateConfig({ color: { value: 'red' } }).color.value).toBe('red');
    expect(validateConfig({ color: { value: 'javascript:alert(1)' } }).color.value).toBe('cyan');
  });

  test('rotation can be turned off as well as on, for fonts and colours', () => {
    expect(validateConfig({ font: { rotate: true } }).font.rotate).toBe(true);
    expect(validateConfig({ font: { rotate: false } }).font.rotate).toBe(false);
    // colour rotation is on by default: switching it off has to stick
    expect(createDefaultConfig().color.rotate).toBe(true);
    expect(validateConfig({ color: { rotate: false } }).color.rotate).toBe(false);
    expect(validateConfig({ color: { rotate: 'yes' } }).color.rotate).toBe(true);
  });

  test('rotation lists keep only valid, unique entries (in a fixed order)', () => {
    expect(validateConfig({ font: { rotationOptions: ['tiny', 'nope', 'slick', 'tiny'] } }).font.rotationOptions).toEqual([
      'slick',
      'tiny',
    ]);
    expect(validateConfig({ color: { rotationOptions: ['red', '', null, 'blue'] } }).color.rotationOptions).toEqual([
      'blue',
      'red',
    ]);
  });

  test('an empty or all-invalid rotation list falls back to the default list', () => {
    expect(validateConfig({ font: { rotationOptions: [] } }).font.rotationOptions).toEqual(VALID_FONTS);
    expect(validateConfig({ font: { rotationOptions: ['nope'] } }).font.rotationOptions).toEqual(VALID_FONTS);
    expect(validateConfig({ color: { rotationOptions: 'cyan' } }).color.rotationOptions).toEqual(
      DEFAULT_CONFIG.color.rotationOptions
    );
  });

  test('snow can be switched on and off, and picks amount and speed by name', () => {
    expect(validateConfig({ snowflakes: { enabled: false } }).snowflakes.enabled).toBe(false);
    expect(validateConfig({}).snowflakes.enabled).toBe(true);
    const snow = validateConfig({ snowflakes: { amount: 'heavy', speed: 'slow' } }).snowflakes;
    expect(snow).toMatchObject({ amount: 'heavy', speed: 'slow' });
    expect(validateConfig({ snowflakes: { amount: 'blizzard', speed: 'warp' } }).snowflakes).toMatchObject({
      amount: 'normal',
      speed: 'normal',
    });
  });

  test('older saves (a snow count and a speed in milliseconds) map to the nearest level', () => {
    expect(validateConfig({ snowflakes: { count: 40, speed: 4500 } }).snowflakes).toMatchObject({
      amount: 'normal',
      speed: 'normal',
    });
    expect(validateConfig({ snowflakes: { count: 10, speed: 9000 } }).snowflakes).toMatchObject({
      amount: 'light',
      speed: 'slow',
    });
    expect(validateConfig({ snowflakes: { count: 200, speed: 500 } }).snowflakes).toMatchObject({
      amount: 'heavy',
      speed: 'fast',
    });
    expect(validateConfig({ snowflakes: { count: -3, speed: 0 } }).snowflakes).toMatchObject({
      amount: 'normal',
      speed: 'normal',
    });
  });

  test('drops settings that no longer exist', () => {
    const config = validateConfig({
      description: 'x',
      font: { availableOptions: ['huge'], frequency: 5 },
      color: { frequency: 5 },
      snowflakes: { options: ['❄'], color: { value: 'red', rotate: true } },
    });
    expect(config).toEqual(createDefaultConfig());
    expect(Object.keys(config).sort()).toEqual(['celebrationMessage', 'color', 'font', 'snowflakes', 'targetDate']);
    expect(Object.keys(config.snowflakes).sort()).toEqual(['amount', 'enabled', 'speed']);
  });
});

describe('snowSettings', () => {
  test('turns the levels into the numbers the snow canvas uses', () => {
    expect(snowSettings({ amount: 'light', speed: 'fast' })).toEqual({ count: SNOW_AMOUNTS.light, speed: SNOW_SPEEDS.fast });
    expect(snowSettings({ amount: 'heavy', speed: 'slow' })).toEqual({ count: SNOW_AMOUNTS.heavy, speed: SNOW_SPEEDS.slow });
  });

  test('has sensible levels: lighter < normal < heavier, slow < normal < fast', () => {
    expect(SNOW_AMOUNTS.light).toBeLessThan(SNOW_AMOUNTS.normal);
    expect(SNOW_AMOUNTS.normal).toBeLessThan(SNOW_AMOUNTS.heavy);
    expect(SNOW_SPEEDS.slow).toBeGreaterThan(SNOW_SPEEDS.normal); // bigger = slower
    expect(SNOW_SPEEDS.normal).toBeGreaterThan(SNOW_SPEEDS.fast);
    expect(SNOW_AMOUNTS.heavy).toBeLessThanOrEqual(200); // the most the snow canvas uses
  });

  test('falls back to normal for missing or unknown settings', () => {
    const normal = { count: SNOW_AMOUNTS.normal, speed: SNOW_SPEEDS.normal };
    expect(snowSettings(undefined)).toEqual(normal);
    expect(snowSettings({ amount: 'x', speed: 'y' })).toEqual(normal);
  });
});

describe('saving and loading', () => {
  test('a saved config loads back the same', () => {
    const config = validateConfig({
      targetDate: '2031-03-04T05:06:00.000Z',
      celebrationMessage: 'Yay',
      font: { name: 'grid', rotate: true, rotationOptions: ['grid', 'tiny'] },
      color: { value: 'red', rotate: false },
      snowflakes: { enabled: false, amount: 'light', speed: 'fast' },
    });
    saveConfig(config);
    expect(loadConfig()).toEqual(config);
  });

  test('loads the defaults when nothing is saved, or what was saved is broken', () => {
    expect(loadConfig()).toEqual(createDefaultConfig());
    localStorage.setItem('countdown-config', '{not json');
    jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(loadConfig()).toEqual(createDefaultConfig());
  });

  test('only remembers the date if it is not the default "next New Year"', () => {
    saveConfig({ ...createDefaultConfig(), celebrationMessage: 'Hi' });
    expect(JSON.parse(localStorage.getItem('countdown-config'))).not.toHaveProperty('targetDate');
    expect(loadConfig().celebrationMessage).toBe('Hi');

    saveConfig({ ...createDefaultConfig(), targetDate: '2031-03-04T05:06:00.000Z' });
    expect(JSON.parse(localStorage.getItem('countdown-config')).targetDate).toBe('2031-03-04T05:06:00.000Z');
    expect(loadConfig().targetDate).toBe('2031-03-04T05:06:00.000Z');
  });

  test('a saved default date follows the calendar instead of going stale', () => {
    saveConfig(createDefaultConfig());
    jest.useFakeTimers().setSystemTime(new Date(2040, 5, 1)); // a later year: a new "next New Year"
    try {
      expect(loadConfig().targetDate).toBe(getNextNewYear(new Date(2040, 5, 1)));
    } finally {
      jest.useRealTimers();
    }
  });

  test('saving returns what was actually saved (checked and completed)', () => {
    const saved = saveConfig({ font: { name: 'nope' }, snowflakes: { count: 100 } });
    expect(saved.font.name).toBe('huge');
    expect(saved.snowflakes.amount).toBe('heavy');
  });
});

describe('date picker helpers', () => {
  test('a date survives the round trip through the picker text', () => {
    const iso = new Date(2026, 11, 31, 23, 59, 0, 0).toISOString();
    expect(toDateTimeLocal(iso)).toBe('2026-12-31T23:59');
    expect(fromDateTimeLocal('2026-12-31T23:59')).toBe(iso);
  });

  test('pads single digits', () => {
    expect(toDateTimeLocal(new Date(2027, 0, 2, 3, 4).toISOString())).toBe('2027-01-02T03:04');
  });

  test('bad input gives an empty text or null, never a thrown error', () => {
    expect(toDateTimeLocal('nope')).toBe('');
    expect(toDateTimeLocal(undefined)).toBe('');
    expect(fromDateTimeLocal('')).toBeNull();
    expect(fromDateTimeLocal(undefined)).toBeNull();
    expect(fromDateTimeLocal('2026-13-45T99:99')).toBeNull();
    expect(fromDateTimeLocal('31/12/2026')).toBeNull();
  });

  test('the quick picks are the next hour, tomorrow midnight and the next New Year', () => {
    const now = new Date(2026, 4, 10, 14, 35, 20);
    const [hour, tomorrow, newYear] = datePresets(now);
    expect(hour.label).toBe('Next hour');
    expect(new Date(hour.iso).getTime()).toBe(new Date(2026, 4, 10, 15, 0, 0).getTime());
    expect(new Date(tomorrow.iso).getTime()).toBe(new Date(2026, 4, 11, 0, 0, 0).getTime());
    expect(new Date(newYear.iso).getTime()).toBe(new Date(2027, 0, 1, 0, 0, 0).getTime());
  });

  test('"next hour" and "tomorrow" roll over month and year ends', () => {
    const [hour, tomorrow] = datePresets(new Date(2026, 11, 31, 23, 30));
    expect(new Date(hour.iso).getTime()).toBe(new Date(2027, 0, 1, 0, 0, 0).getTime());
    expect(new Date(tomorrow.iso).getTime()).toBe(new Date(2027, 0, 1, 0, 0, 0).getTime());
  });
});
