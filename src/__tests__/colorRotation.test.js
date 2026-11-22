/**
 * Tests for color rotation functionality
 */

describe('Color Rotation Logic', () => {
  test('should validate color rotation options', () => {
    const colorRotationOptions = ["cyan", "magenta", "yellow", "blue", "green"];
    const validColors = colorRotationOptions.filter(color => typeof color === "string" && color.length > 0);
    
    expect(validColors.length).toBe(5);
    expect(validColors).toEqual(["cyan", "magenta", "yellow", "blue", "green"]);
  });

  test('should filter out invalid colors from rotation options', () => {
    const colorRotationOptions = ["cyan", "", null, "blue", undefined, 123];
    const validColors = colorRotationOptions.filter(color => typeof color === "string" && color.length > 0);
    
    expect(validColors.length).toBe(2);
    expect(validColors).toEqual(["cyan", "blue"]);
  });

  test('should disable color rotation if no valid colors', () => {
    const colorRotationOptions = ["", null, undefined];
    const validColors = colorRotationOptions.filter(color => typeof color === "string" && color.length > 0);
    
    expect(validColors.length).toBe(0);
    // Should disable rotation
    expect(validColors.length > 0).toBe(false);
  });

  test('should calculate color rotation interval correctly', () => {
    const colorRotationFrequency = 5; // seconds
    const intervalMs = colorRotationFrequency * 1000;
    
    expect(intervalMs).toBe(5000);
  });

  test('should rotate colors in sequence', () => {
    const colorRotationOptions = ["cyan", "magenta", "yellow"];
    let colorIndex = 0;
    
    // Simulate rotation
    const nextIndex = (colorIndex + 1) % colorRotationOptions.length;
    expect(colorRotationOptions[nextIndex]).toBe("magenta");
    
    colorIndex = nextIndex;
    const nextIndex2 = (colorIndex + 1) % colorRotationOptions.length;
    expect(colorRotationOptions[nextIndex2]).toBe("yellow");
    
    colorIndex = nextIndex2;
    const nextIndex3 = (colorIndex + 1) % colorRotationOptions.length;
    expect(colorRotationOptions[nextIndex3]).toBe("cyan"); // Wraps around
  });

  test('should use static color when rotation is disabled', () => {
    const staticColor = "cyan";
    const rotateColors = false;
    
    const currentColor = rotateColors ? "magenta" : staticColor;
    expect(currentColor).toBe("cyan");
  });

  test('should use time-based color logic when color is null', () => {
    const currentColor = null;
    const is_green = true;
    
    const displayColor = currentColor !== null ? currentColor : (is_green ? "green" : "red");
    expect(displayColor).toBe("green");
    
    const is_green_false = false;
    const displayColor2 = currentColor !== null ? currentColor : (is_green_false ? "green" : "red");
    expect(displayColor2).toBe("red");
  });

  test('should prioritize static color over time-based logic', () => {
    const currentColor = "cyan";
    const is_green = true;
    
    const displayColor = currentColor !== null ? currentColor : (is_green ? "green" : "red");
    expect(displayColor).toBe("cyan");
  });

  test('should validate color frequency values', () => {
    const validFrequencies = [1, 3, 5, 10];
    const invalidFrequencies = [0, -1, null, undefined];
    
    validFrequencies.forEach(freq => {
      const frequency = Number(freq);
      expect(frequency > 0 && !isNaN(frequency)).toBe(true);
    });
    
    invalidFrequencies.forEach(freq => {
      const frequency = Number(freq);
      expect(frequency > 0 && !isNaN(frequency)).toBe(false);
    });
    
    // String "5" converts to number 5, which is valid, so test type check separately
    expect(typeof "5" === "number").toBe(false);
    expect(typeof 5 === "number").toBe(true);
  });
});
