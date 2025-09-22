/**
 * Jest Setup for DirectoryBolt Enterprise Testing
 * Configures test environment and global settings
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

// Set test environment variables
process.env.NODE_ENV = 'test'
process.env.TEST_BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3002'

// Ensure required environment variables are available for tests
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL not found in environment')
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://placeholder.supabase.co'
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment')
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'placeholder-service-role-key'
}

// Extend Jest matchers for better assertions
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      }
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      }
    }
  },
  
  toHavePerformanceWithin(received, maxMs) {
    const pass = received <= maxMs
    if (pass) {
      return {
        message: () =>
          `expected ${received}ms not to be within performance target of ${maxMs}ms`,
        pass: true,
      }
    } else {
      return {
        message: () =>
          `expected ${received}ms to be within performance target of ${maxMs}ms`,
        pass: false,
      }
    }
  }
})

// Global test configuration
const testConfig = {
  // API timeouts for enterprise testing
  DEFAULT_TIMEOUT: 5000,
  PERFORMANCE_TIMEOUT: 500,
  INTEGRATION_TIMEOUT: 15000,
  
  // Test data patterns
  TEST_CUSTOMER_PREFIX: 'TEST-',
  TEST_EMAIL_DOMAIN: '@enterprise-test.com',
  
  // Performance thresholds
  API_PERFORMANCE_TARGET: 500, // ms
  DATABASE_PERFORMANCE_TARGET: 200, // ms
  REAL_TIME_PERFORMANCE_TARGET: 100, // ms
}

// Make test config globally available
global.testConfig = testConfig

// Global setup for all tests
beforeAll(async () => {
  console.log('🧪 DirectoryBolt Enterprise Test Suite Starting')
  console.log(`📊 Test Environment: ${process.env.NODE_ENV}`)
  console.log(`🎯 Performance Targets: API <${testConfig.API_PERFORMANCE_TARGET}ms, DB <${testConfig.DATABASE_PERFORMANCE_TARGET}ms`)
})

// Global cleanup for all tests
afterAll(async () => {
  console.log('✅ DirectoryBolt Enterprise Test Suite Completed')
})

// Suppress console logs during tests unless in debug mode
if (!process.env.DEBUG_TESTS) {
  const originalConsoleLog = console.log
  const originalConsoleWarn = console.warn
  const originalConsoleError = console.error
  
  console.log = (...args) => {
    // Only show test framework logs and important messages
    if (args[0] && (
      args[0].includes('🧪') || 
      args[0].includes('✅') || 
      args[0].includes('❌') ||
      args[0].includes('📊') ||
      args[0].includes('⚡') ||
      args[0].includes('🎯')
    )) {
      originalConsoleLog(...args)
    }
  }
  
  console.warn = (...args) => {
    // Show warnings that might indicate test issues
    if (args[0] && (
      args[0].includes('warn') ||
      args[0].includes('deprecat')
    )) {
      originalConsoleWarn(...args)
    }
  }
  
  console.error = (...args) => {
    // Always show errors
    originalConsoleError(...args)
  }
}

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  // Don't exit the process during tests, but log the error
})

// Handle uncaught exceptions in tests
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  // Don't exit the process during tests, but log the error
})

// Mock external services that aren't available in test environment
jest.mock('next/router', () => require('next-router-mock'))

// Set reasonable timeouts for different test types
jest.setTimeout(30000) // 30 seconds default

console.log('🔧 Jest setup completed for DirectoryBolt Enterprise Testing')