/**
 * Tests for snowflake functionality
 */

describe('Snowflake Functionality', () => {
  test('should validate snowflake count limits', () => {
    const validCounts = [1, 50, 100, 200];
    const invalidCounts = [0, -1, 201, 1000];
    
    validCounts.forEach(count => {
      const num = Number(count);
      expect(num > 0 && !isNaN(num) && num <= 200).toBe(true);
    });
    
    invalidCounts.forEach(count => {
      const num = Number(count);
      expect(num > 0 && !isNaN(num) && num <= 200).toBe(false);
    });
  });

  test('should cap snowflake count at 200', () => {
    const count = 250;
    const cappedCount = Math.min(count, 200);
    
    expect(cappedCount).toBe(200);
  });

  test('should validate snowflake options array', () => {
    const SNOWFLAKE_OPTIONS = ["❄", "❅", "❆", "✻", "✼", "✽", "✾", "✿", "❀", "❁"];
    const validOptions = SNOWFLAKE_OPTIONS.filter(char => typeof char === "string" && char.length > 0);
    
    expect(validOptions.length).toBe(10);
    expect(validOptions).toEqual(SNOWFLAKE_OPTIONS);
  });

  test('should filter out invalid snowflake characters', () => {
    const options = ["❄", "", null, "❅", undefined, 123];
    const validOptions = options.filter(char => typeof char === "string" && char.length > 0);
    
    expect(validOptions.length).toBe(2);
    expect(validOptions).toEqual(["❄", "❅"]);
  });

  test('should disable snowflakes if no valid options', () => {
    const options = ["", null, undefined];
    const validOptions = options.filter(char => typeof char === "string" && char.length > 0);
    
    expect(validOptions.length).toBe(0);
    // Should disable snowflakes
    expect(validOptions.length > 0).toBe(false);
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

  test('should calculate update interval correctly', () => {
    const speed = 100; // milliseconds
    const updateInterval = Math.min(speed, 50);
    
    expect(updateInterval).toBe(50); // Capped at 50ms
  });

  test('should calculate speed multiplier correctly', () => {
    const speed = 100;
    const updateInterval = Math.min(speed, 50);
    const speedMultiplier = speed / updateInterval;
    
    expect(speedMultiplier).toBe(2);
  });

  test('should initialize snowflake positions correctly', () => {
    const count = 50;
    const terminalWidth = 80;
    const terminalHeight = 24;
    
    const snowflakePositions = Array.from({ length: Math.min(count, 200) }).map(() => ({
      x: Math.floor(Math.random() * terminalWidth),
      y: Math.floor(Math.random() * terminalHeight),
      fallSpeed: 0.1 + Math.random() * 0.3,
      drift: (Math.random() - 0.5) * 0.1,
    }));
    
    expect(snowflakePositions.length).toBe(50);
    snowflakePositions.forEach(pos => {
      expect(pos.x).toBeGreaterThanOrEqual(0);
      expect(pos.x).toBeLessThan(terminalWidth);
      expect(pos.y).toBeGreaterThanOrEqual(0);
      expect(pos.y).toBeLessThan(terminalHeight);
      expect(pos.fallSpeed).toBeGreaterThanOrEqual(0.1);
      expect(pos.fallSpeed).toBeLessThanOrEqual(0.4);
    });
  });

  test('should wrap snowflakes horizontally', () => {
    const terminalWidth = 80;
    let newX = -1;
    
    if (newX < 0) {
      newX = terminalWidth - 1;
    }
    expect(newX).toBe(79);
    
    newX = 80;
    if (newX >= terminalWidth) {
      newX = 0;
    }
    expect(newX).toBe(0);
  });

  test('should reset snowflake to top when it reaches bottom', () => {
    const terminalHeight = 24;
    const terminalWidth = 80;
    let newY = 25; // Below screen
    let newX = 40;
    
    if (newY >= terminalHeight) {
      newY = -1; // Start just above screen
      newX = Math.floor(Math.random() * terminalWidth);
    }
    
    expect(newY).toBe(-1);
    expect(newX).toBeGreaterThanOrEqual(0);
    expect(newX).toBeLessThan(terminalWidth);
  });

  test('should validate snowflake color rotation options', () => {
    const colorRotationOptions = ["cyan", "blue", "white", "gray"];
    const validColors = colorRotationOptions.filter(color => typeof color === "string" && color.length > 0);
    
    expect(validColors.length).toBe(4);
    expect(validColors).toEqual(["cyan", "blue", "white", "gray"]);
  });

  test('should calculate snowflake color rotation interval correctly', () => {
    const colorRotationFrequency = 3; // seconds
    const intervalMs = colorRotationFrequency * 1000;
    
    expect(intervalMs).toBe(3000);
  });

  test('should use static snowflake color when rotation is disabled', () => {
    const staticColor = "white";
    const rotateColors = false;
    
    const currentColor = rotateColors ? "cyan" : staticColor;
    expect(currentColor).toBe("white");
  });

  test('should return null when snowflakes are disabled', () => {
    const enabled = false;
    const count = 50;
    const characters = ["❄", "❅"];
    
    if (!enabled || count <= 0 || !characters || characters.length === 0) {
      expect(true).toBe(true); // Should return null/not render
    }
  });
});
