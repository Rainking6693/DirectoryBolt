/**
 * Custom Error Classes for DirectoryBolt
 */

export class RateLimitError extends Error {
  constructor(message: string, public retryAfter?: number) {
    super(message)
    this.name = 'RateLimitError'
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class AirtableError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message)
    this.name = 'AirtableError'
  }
}