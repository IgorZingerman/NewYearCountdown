# Test Suite

This directory contains comprehensive functional tests for the New Year Countdown application.

## Test Files

- **config.test.js** - Tests for configuration loading and validation
- **countdown.test.js** - Tests for countdown time calculations
- **sayWords.test.js** - Tests for audio/speech triggers at specific times
- **fontRotation.test.js** - Tests for font rotation logic
- **colorRotation.test.js** - Tests for color rotation logic
- **snowflakes.test.js** - Tests for snowflake animation functionality
- **screenSaver.test.js** - Tests for screen saver prevention (macOS)
- **terminalDimensions.test.js** - Tests for terminal dimension handling
- **integration.test.js** - Integration tests for complete workflows
- **utils.test.js** - Tests for utility functions and helpers

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Coverage

The test suite covers:

1. **Configuration Loading**
   - Valid/invalid date parsing
   - Font configuration validation
   - Color configuration validation
   - Snowflake configuration validation

2. **Countdown Logic**
   - Time difference calculations
   - Hours, minutes, seconds extraction
   - is_green logic (green when time remaining, red at zero)
   - Time formatting and padding

3. **Font Rotation**
   - Font validation
   - Rotation sequence
   - Frequency calculations
   - Invalid font filtering

4. **Color Rotation**
   - Color validation
   - Rotation sequence
   - Static vs rotating colors
   - Time-based color logic (green/red)

5. **Snowflakes**
   - Count validation and limits
   - Speed calculations
   - Position updates
   - Color rotation for snowflakes
   - Wrapping and reset logic

6. **Screen Saver Prevention**
   - caffeinate process spawning (macOS)
   - Cleanup handlers
   - Error handling
   - Platform detection

7. **Audio/Speech Triggers**
   - One hour notice
   - 20 minute notice
   - Final countdown (6 minutes)
   - 30 second notice
   - 10-1 second countdown
   - Happy New Year message

8. **Terminal Dimensions**
   - Default fallback values
   - Resize event handling
   - Dimension updates

## Notes

- Tests use Jest with ES module support
- Child process operations are mocked to avoid actual system calls
- Console output is suppressed during tests to reduce noise
- Tests are designed to be platform-independent where possible
