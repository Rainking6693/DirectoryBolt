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

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthorizationError'
  }
}

export function handleApiError(error: any, res: any) {
  console.error('API Error:', error)
  
  if (error instanceof AuthorizationError) {
    return res.status(403).json({ error: error.message })
  }
  
  if (error instanceof AuthenticationError) {
    return res.status(401).json({ error: error.message })
  }
  
  if (error instanceof ValidationError) {
    return res.status(400).json({ error: error.message, field: error.field })
  }
  
  if (error instanceof RateLimitError) {
    return res.status(429).json({ error: error.message, retryAfter: error.retryAfter })
  }
  
  return res.status(500).json({ error: 'Internal server error' })
}

export class ApiError extends Error {
  constructor(message: string, public statusCode: number = 500) {
    super(message)
    this.name = 'ApiError'
  }
}

export class ExternalServiceError extends Error {
  constructor(message: string, public service?: string) {
    super(message)
    this.name = 'ExternalServiceError'
  }
}

export const Errors = {
  RateLimitError,
  ValidationError,
  AuthenticationError,
  AirtableError,
  AuthorizationError,
  ApiError,
  ExternalServiceError
}