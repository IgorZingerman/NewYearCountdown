/**
 * Jest setup file for test configuration
 * Note: jest.mock() cannot be used in ES module setup files
 * Mocks should be defined in individual test files using jest.unstable_mockModule()
 */

// Mock console methods to reduce noise in tests (if needed)
// Note: We keep console methods available for debugging
