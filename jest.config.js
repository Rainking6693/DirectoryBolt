/**
 * Jest Configuration for DirectoryBolt Enterprise Testing
 * Enhanced for enterprise-grade testing with 95%+ coverage standards
 */
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Enhanced test patterns for comprehensive coverage
  testMatch: [
    // Original test patterns
    '<rootDir>/tests/unit/**/*.test.js',
    '<rootDir>/tests/integration/**/*.test.js', 
    '<rootDir>/tests/ai/**/*.test.js',
    '<rootDir>/tests/validation/**/*.test.js',
    '<rootDir>/tests/performance/**/*.test.js',
    // New enterprise test patterns
    '<rootDir>/__tests__/**/*.test.ts',
    '<rootDir>/__tests__/**/*.test.js'
  ],
  
  // Enhanced coverage collection for enterprise standards
  collectCoverageFrom: [
    'lib/**/*.{js,ts}',
    'pages/api/**/*.{js,ts}',
    'components/**/*.{tsx,ts,jsx,js}',
    '!lib/**/*.d.ts',
    '!lib/test-utils/**/*',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/__tests__/**',
    '!**/coverage/**'
  ],
  
  // Enterprise coverage thresholds - DirectoryBolt standards
  coverageThreshold: {
    global: {
      branches: 85,      // 85% branch coverage
      functions: 90,     // 90% function coverage  
      lines: 95,         // 95% line coverage
      statements: 95     // 95% statement coverage
    },
    // Critical API endpoints require higher coverage
    './pages/api/staff/**/*.ts': {
      branches: 90,
      functions: 95,
      lines: 98,
      statements: 98
    },
    './pages/api/autobolt/**/*.ts': {
      branches: 90,
      functions: 95,
      lines: 98,
      statements: 98
    }
  },
  
  // Enhanced reporting for enterprise standards
  coverageReporters: ['text', 'text-summary', 'lcov', 'json-summary', 'html'],
  coverageDirectory: 'coverage',
  
  // TypeScript support
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx'
      }
    }]
  },
  
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Enterprise test timeout and performance settings
  testTimeout: 60000,
  maxWorkers: '50%',
  
  // Verbose output for enterprise debugging
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
  
  // Module name mapping for cleaner imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/pages/(.*)$': '<rootDir>/pages/$1'
  },
  
  // Test environment setup
  testEnvironmentOptions: {
    url: 'http://localhost:3002'
  },
  
  // Ignore patterns to avoid conflicts
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/coverage/',
    '/archive/',
    '/.netlify/'
  ]
}