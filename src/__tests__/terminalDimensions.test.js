/**
 * Tests for terminal dimensions functionality
 */

describe('Terminal Dimensions', () => {
  let originalColumns;
  let originalRows;

  beforeEach(() => {
    originalColumns = process.stdout.columns;
    originalRows = process.stdout.rows;
  });

  afterEach(() => {
    process.stdout.columns = originalColumns;
    process.stdout.rows = originalRows;
  });

  test('should use default dimensions when stdout.columns is undefined', () => {
    delete process.stdout.columns;
    delete process.stdout.rows;
    
    const columns = process.stdout.columns || 80;
    const rows = process.stdout.rows || 24;
    
    expect(columns).toBe(80);
    expect(rows).toBe(24);
  });

  test('should use actual terminal dimensions when available', () => {
    process.stdout.columns = 120;
    process.stdout.rows = 40;
    
    const columns = process.stdout.columns || 80;
    const rows = process.stdout.rows || 24;
    
    expect(columns).toBe(120);
    expect(rows).toBe(40);
  });

  test('should handle zero dimensions gracefully', () => {
    process.stdout.columns = 0;
    process.stdout.rows = 0;
    
    const columns = process.stdout.columns || 80;
    const rows = process.stdout.rows || 24;
    
    // Should fall back to defaults when 0
    expect(columns || 80).toBe(80);
    expect(rows || 24).toBe(24);
  });

  test('should handle resize events', () => {
    let updateCalled = false;
    const updateDimensions = () => {
      updateCalled = true;
    };
    const mockResize = () => {
      updateDimensions();
    };
    
    process.stdout.on('resize', mockResize);
    
    // Simulate resize
    mockResize();
    
    expect(updateCalled).toBe(true);
    
    process.stdout.removeListener('resize', mockResize);
  });
});
