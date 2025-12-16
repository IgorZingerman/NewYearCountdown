export default {
  testEnvironment: 'node',
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'src/cli/**/*.js',
    'src/lib/**/*.js',
    'src/hooks/**/*.js',
    'src/components/**/*.{js,jsx}',
    '!src/**/__tests__/**',
    '!src/**/*.test.js',
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  globals: {
    'jest': true,
  },
};
