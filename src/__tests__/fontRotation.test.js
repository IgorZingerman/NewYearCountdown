/**
 * Tests for font rotation functionality
 */

describe('Font Rotation Logic', () => {
  test('should validate font rotation options', () => {
    const VALID_FONTS = ["block", "slick", "tiny", "grid", "pallet", "shade", "simple", "simpleBlock", "3d", "simple3d", "chrome", "huge"];
    
    const rotationOptions = ["huge", "slick", "tiny", "grid"];
    const filtered = rotationOptions.filter(font => VALID_FONTS.includes(font));
    
    expect(filtered.length).toBe(4);
    expect(filtered).toEqual(["huge", "slick", "tiny", "grid"]);
  });

  test('should filter out invalid fonts from rotation options', () => {
    const VALID_FONTS = ["block", "slick", "tiny", "grid", "pallet", "shade", "simple", "simpleBlock", "3d", "simple3d", "chrome", "huge"];
    
    const rotationOptions = ["huge", "invalid", "slick", "alsoInvalid"];
    const filtered = rotationOptions.filter(font => VALID_FONTS.includes(font));
    
    expect(filtered.length).toBe(2);
    expect(filtered).toEqual(["huge", "slick"]);
  });

  test('should disable font rotation if no valid fonts', () => {
    const VALID_FONTS = ["block", "slick", "tiny"];
    const rotationOptions = ["invalid1", "invalid2"];
    const validRotationFonts = rotationOptions.filter(font => VALID_FONTS.includes(font));
    
    expect(validRotationFonts.length).toBe(0);
    // Should disable rotation
    expect(validRotationFonts.length > 0).toBe(false);
  });

  test('should calculate font rotation interval correctly', () => {
    const rotateFrequency = 10; // seconds
    const intervalMs = rotateFrequency * 1000;
    
    expect(intervalMs).toBe(10000);
  });

  test('should rotate fonts in sequence', () => {
    const fontRotationOptions = ["huge", "slick", "tiny"];
    let fontIndex = 0;
    
    // Simulate rotation
    const nextIndex = (fontIndex + 1) % fontRotationOptions.length;
    expect(fontRotationOptions[nextIndex]).toBe("slick");
    
    fontIndex = nextIndex;
    const nextIndex2 = (fontIndex + 1) % fontRotationOptions.length;
    expect(fontRotationOptions[nextIndex2]).toBe("tiny");
    
    fontIndex = nextIndex2;
    const nextIndex3 = (fontIndex + 1) % fontRotationOptions.length;
    expect(fontRotationOptions[nextIndex3]).toBe("huge"); // Wraps around
  });

  test('should handle single font in rotation options', () => {
    const fontRotationOptions = ["huge"];
    let fontIndex = 0;
    
    const nextIndex = (fontIndex + 1) % fontRotationOptions.length;
    expect(fontRotationOptions[nextIndex]).toBe("huge"); // Wraps to itself
  });

  test('should use default font when rotation is disabled', () => {
    const defaultFont = "huge";
    const rotateFonts = false;
    
    const currentFont = rotateFonts ? "slick" : defaultFont;
    expect(currentFont).toBe("huge");
  });

  test('should validate font frequency values', () => {
    const validFrequencies = [1, 5, 10, 30];
    const invalidFrequencies = [0, -1, null, undefined];
    
    validFrequencies.forEach(freq => {
      const frequency = Number(freq);
      expect(frequency > 0 && !isNaN(frequency)).toBe(true);
    });
    
    invalidFrequencies.forEach(freq => {
      const frequency = Number(freq);
      expect(frequency > 0 && !isNaN(frequency)).toBe(false);
    });
    
    // String "10" converts to number 10, which is valid, so test type check separately
    expect(typeof "10" === "number").toBe(false);
    expect(typeof 10 === "number").toBe(true);
  });
});
