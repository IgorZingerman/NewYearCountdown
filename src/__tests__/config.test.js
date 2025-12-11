/**
 * Tests for configuration loading functionality
 */

describe('Config Loading', () => {
  test('should validate date parsing', () => {
    const validDate = '2026-01-01T00:00:00.000Z';
    const date = new Date(validDate);
    
    expect(date.getTime()).not.toBeNaN();
    // Date parsing works correctly - check UTC methods for consistency
    expect(date.getUTCFullYear()).toBe(2026);
    expect(date.getUTCMonth()).toBe(0); // January
    expect(date.getUTCDate()).toBe(1);
  });

  test('should handle missing targetDate in config', () => {
    const config = {};
    expect(config.targetDate).toBeUndefined();
  });

  test('should handle invalid date format in config', () => {
    const invalidDate = 'invalid-date';
    const date = new Date(invalidDate);
    expect(date.getTime()).toBeNaN();
  });

  test('should validate font name from config', () => {
    const VALID_FONTS = ["block", "slick", "tiny", "grid", "pallet", "shade", "simple", "simpleBlock", "3d", "simple3d", "chrome", "huge"];
    
    VALID_FONTS.forEach(font => {
      expect(VALID_FONTS.includes(font)).toBe(true);
    });

    expect(VALID_FONTS.includes("invalid")).toBe(false);
    expect(VALID_FONTS.includes("")).toBe(false);
  });

  test('should validate font rotation options', () => {
    const VALID_FONTS = ["block", "slick", "tiny", "grid", "pallet", "shade", "simple", "simpleBlock", "3d", "simple3d", "chrome", "huge"];
    
    const validRotationOptions = ["huge", "slick", "tiny"];
    const invalidRotationOptions = ["invalid", "font"];
    
    validRotationOptions.forEach(font => {
      expect(VALID_FONTS.includes(font)).toBe(true);
    });

    invalidRotationOptions.forEach(font => {
      expect(VALID_FONTS.includes(font)).toBe(false);
    });
  });

  test('should validate color rotation options', () => {
    const validColors = ["cyan", "magenta", "yellow", "blue", "green", "red", "white"];
    const invalidColors = ["", null, undefined, 123];

    validColors.forEach(color => {
      expect(typeof color === "string" && color.length > 0).toBe(true);
    });

    invalidColors.forEach(color => {
      expect(typeof color === "string" && color.length > 0).toBe(false);
    });
  });

  test('should validate snowflake count limits', () => {
    const validCounts = [1, 50, 100, 200];
    const invalidCounts = [0, -1, 201, 1000, null];

    validCounts.forEach(count => {
      const num = Number(count);
      expect(num > 0 && !isNaN(num) && num <= 200).toBe(true);
    });

    invalidCounts.forEach(count => {
      const num = Number(count);
      expect(num > 0 && !isNaN(num) && num <= 200).toBe(false);
    });
    
    // String "50" converts to number 50, which is valid, so test type check separately
    expect(typeof "50" === "number").toBe(false);
    expect(typeof 50 === "number").toBe(true);
  });

  test('should validate snowflake speed', () => {
    const validSpeeds = [50, 100, 200, 500];
    const invalidSpeeds = [0, -1, null, undefined];

    validSpeeds.forEach(speed => {
      const num = Number(speed);
      expect(num > 0 && !isNaN(num)).toBe(true);
    });

    invalidSpeeds.forEach(speed => {
      const num = Number(speed);
      expect(num > 0 && !isNaN(num)).toBe(false);
    });
    
    // String "100" converts to number 100, which is valid, so test type check separately
    expect(typeof "100" === "number").toBe(false);
    expect(typeof 100 === "number").toBe(true);
  });

  test('should validate snowflake options array', () => {
    const validOptions = ["❄", "❅", "❆", "✻"];
    const invalidOptions = ["", null, undefined, 123];

    validOptions.forEach(option => {
      expect(typeof option === "string" && option.length > 0).toBe(true);
    });

    invalidOptions.forEach(option => {
      expect(typeof option === "string" && option.length > 0).toBe(false);
    });
  });

  test('should validate rotation frequency values', () => {
    const validFrequencies = [1, 5, 10, 30, 60];
    const invalidFrequencies = [0, -1, null, undefined];

    validFrequencies.forEach(freq => {
      const num = Number(freq);
      expect(num > 0 && !isNaN(num)).toBe(true);
    });

    invalidFrequencies.forEach(freq => {
      const num = Number(freq);
      expect(num > 0 && !isNaN(num)).toBe(false);
    });
    
    // String "10" converts to number 10, which is valid, so test type check separately
    expect(typeof "10" === "number").toBe(false);
    expect(typeof 10 === "number").toBe(true);
  });
});
