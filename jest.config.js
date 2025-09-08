module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.js'],
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.js',
    '<rootDir>/tests/integration/**/*.test.js',
    '<rootDir>/tests/ai/**/*.test.js',
    '<rootDir>/tests/validation/**/*.test.js',
    '<rootDir>/tests/performance/**/*.test.js'
  ],
  collectCoverageFrom: [
    'lib/**/*.{js,ts}',
    'pages/api/**/*.{js,ts}',
    '!lib/**/*.d.ts',
    '!lib/test-utils/**/*',
    '!**/node_modules/**',
    '!**/.next/**'
  ],
  coverageReporters: ['text', 'lcov', 'json-summary'],
  testTimeout: 60000,
  maxWorkers: 4
}