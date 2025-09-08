// Global Jest setup for DirectoryBolt AI testing
// Use built-in fetch in Node 18+ or skip fetch setup for now
// global.fetch = require('node-fetch')

// Increase timeout for AI operations
jest.setTimeout(120000)

// Mock environment variables for testing
process.env.NODE_ENV = 'test'
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'mock-openai-key-for-testing'
process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'mock-anthropic-key-for-testing'

// Global test utilities
global.testUtils = {
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  randomString: () => Math.random().toString(36).substring(7),
  generateTestUrl: () => 'https://example-business-' + Math.random().toString(36).substring(7) + '.com'
}

// Mock console to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: console.warn,
  error: console.error,
}