/**
 * Tests for utility functions and helpers
 */

describe('Utility Functions', () => {
  test('should pad numbers correctly', () => {
    expect("0".padStart(2, "0")).toBe("00");
    expect("5".padStart(2, "0")).toBe("05");
    expect("10".padStart(2, "0")).toBe("10");
    expect("59".padStart(2, "0")).toBe("59");
  });

  test('should calculate modulo correctly for rotation', () => {
    const options = ["a", "b", "c"];
    let index = 0;
    
    index = (index + 1) % options.length;
    expect(index).toBe(1);
    
    index = (index + 1) % options.length;
    expect(index).toBe(2);
    
    index = (index + 1) % options.length;
    expect(index).toBe(0); // Wraps around
  });

  test('should convert seconds to milliseconds', () => {
    const seconds = 10;
    const milliseconds = seconds * 1000;
    expect(milliseconds).toBe(10000);
  });

  test('should calculate Math.floor correctly for time', () => {
    const epoch_diff = 3661.5; // 1 hour, 1 minute, 1.5 seconds
    const hour = Math.floor(epoch_diff / 60 / 60);
    const minute = Math.floor((epoch_diff / 60) % 60);
    const second = Math.floor(epoch_diff % 60);
    
    expect(hour).toBe(1);
    expect(minute).toBe(1);
    expect(second).toBe(1); // Floors down
  });

  test('should handle array filtering correctly', () => {
    const array = [1, 2, 3, 4, 5];
    const filtered = array.filter(item => item > 2);
    expect(filtered).toEqual([3, 4, 5]);
  });

  test('should handle array mapping correctly', () => {
    const array = [1, 2, 3];
    const mapped = array.map(item => item * 2);
    expect(mapped).toEqual([2, 4, 6]);
  });

  test('should handle Math.min correctly', () => {
    expect(Math.min(100, 50)).toBe(50);
    expect(Math.min(50, 100)).toBe(50);
    expect(Math.min(200, 200)).toBe(200);
  });

  test('should handle Math.max correctly', () => {
    expect(Math.max(100, 50)).toBe(100);
    expect(Math.max(50, 100)).toBe(100);
  });

  test('should handle Math.random within bounds', () => {
    const min = 0;
    const max = 10;
    const random = Math.random() * (max - min) + min;
    
    expect(random).toBeGreaterThanOrEqual(min);
    expect(random).toBeLessThan(max);
  });

  test('should handle string concatenation for time', () => {
    const hour = 2;
    const minute = 5;
    const second = 30;
    const time = `${hour}:${minute}:${second}`;
    
    expect(time).toBe("2:5:30");
  });

  test('should handle date creation and manipulation', () => {
    const date = new Date(2026, 0, 1, 0, 0, 0, 0);
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(0);
    expect(date.getDate()).toBe(1);
    expect(date.getHours()).toBe(0);
    expect(date.getMinutes()).toBe(0);
    expect(date.getSeconds()).toBe(0);
  });

  test('should handle date ISO string parsing', () => {
    const isoString = '2026-01-01T00:00:00.000Z';
    const date = new Date(isoString);
    
    expect(date.getTime()).not.toBeNaN();
    expect(date.toISOString()).toBe(isoString);
  });

  test('should handle date difference calculation', () => {
    const date1 = new Date('2026-01-01T00:00:00.000Z');
    const date2 = new Date('2025-12-31T23:59:00.000Z');
    const diff = date1 - date2;
    
    expect(diff).toBe(60000); // 60 seconds = 60000 milliseconds
  });
});
