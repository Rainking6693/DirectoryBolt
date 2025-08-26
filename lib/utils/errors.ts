// 🔒 JORDAN'S ERROR HANDLING SYSTEM - Comprehensive error management
// Structured error handling with proper logging and user-friendly messages

export class AppError extends Error {
  public readonly statusCode: number
  public readonly errorCode: string
  public readonly isOperational: boolean
  public readonly timestamp: Date
  
  constructor(
    message: string,
    statusCode: number = 500,
    errorCode: string = 'INTERNAL_ERROR',
    isOperational: boolean = true
  ) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.errorCode = errorCode
    this.isOperational = isOperational
    this.timestamp = new Date()
    
    Error.captureStackTrace(this, this.constructor)
  }
}

// API-specific errors
export class ApiError extends AppError {
  constructor(message: string, statusCode: number, errorCode: string) {
    super(message, statusCode, errorCode)
  }
}

export class ValidationError extends ApiError {
  public readonly field: string
  
  constructor(message: string, field: string, errorCode: string = 'VALIDATION_ERROR') {
    super(message, 400, errorCode)
    this.field = field
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication required', errorCode: string = 'AUTH_REQUIRED') {
    super(message, 401, errorCode)
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string = 'Insufficient permissions', errorCode: string = 'INSUFFICIENT_PERMISSIONS') {
    super(message, 403, errorCode)
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string = 'Resource', errorCode: string = 'NOT_FOUND') {
    super(`${resource} not found`, 404, errorCode)
  }
}

export class RateLimitError extends ApiError {
  public readonly resetTime: number
  public readonly remaining: number
  
  constructor(resetTime: number, remaining: number = 0) {
    super('Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED')
    this.resetTime = resetTime
    this.remaining = remaining
  }
}

export class DatabaseError extends AppError {
  public readonly query?: string
  
  constructor(message: string, query?: string, errorCode: string = 'DATABASE_ERROR') {
    super(message, 500, errorCode)
    this.query = query
  }
}

export class ExternalServiceError extends AppError {
  public readonly service: string
  public readonly originalError?: Error
  
  constructor(service: string, message: string, originalError?: Error, errorCode: string = 'EXTERNAL_SERVICE_ERROR') {
    super(`${service}: ${message}`, 502, errorCode)
    this.service = service
    this.originalError = originalError
  }
}

// Error response interface
export interface ErrorResponse {
  success: false
  error: {
    message: string
    code: string
    statusCode: number
    timestamp: string
    field?: string
    details?: any
  }
  requestId: string
}

// Error handler for API routes
export function handleApiError(error: Error, requestId: string): ErrorResponse {
  let statusCode = 500
  let errorCode = 'INTERNAL_ERROR'
  let message = 'An unexpected error occurred'
  let field: string | undefined
  let details: any
  
  if (error instanceof ApiError) {
    statusCode = error.statusCode
    errorCode = error.errorCode
    message = error.message
    
    if (error instanceof ValidationError) {
      field = error.field
    }
    
    if (error instanceof RateLimitError) {
      details = {
        resetTime: error.resetTime,
        remaining: error.remaining
      }
    }
  } else if (error instanceof AppError && error.isOperational) {
    statusCode = error.statusCode
    errorCode = error.errorCode
    message = error.message
  } else {
    // Log unexpected errors but don't expose details to users
    console.error('Unexpected error:', {
      message: error.message,
      stack: error.stack,
      requestId
    })
    
    // In production, hide internal error details
    if (process.env.NODE_ENV === 'production') {
      message = 'Internal server error'
    } else {
      message = error.message
    }
  }
  
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      message,
      code: errorCode,
      statusCode,
      timestamp: new Date().toISOString(),
      ...(field && { field }),
      ...(details && { details })
    },
    requestId
  }
  
  return errorResponse
}

// Common error factories
export const Errors = {
  // Authentication & Authorization
  invalidCredentials: () => new AuthenticationError('Invalid email or password', 'INVALID_CREDENTIALS'),
  tokenExpired: () => new AuthenticationError('Token has expired', 'TOKEN_EXPIRED'),
  invalidToken: () => new AuthenticationError('Invalid token', 'INVALID_TOKEN'),
  accountLocked: (lockUntil: Date) => new AuthenticationError(
    `Account locked until ${lockUntil.toISOString()}`, 
    'ACCOUNT_LOCKED'
  ),
  insufficientCredits: (required: number, available: number) => new AuthorizationError(
    `Insufficient credits. Required: ${required}, Available: ${available}`,
    'INSUFFICIENT_CREDITS'
  ),
  
  // Validation
  required: (field: string) => new ValidationError(`${field} is required`, field, 'REQUIRED'),
  invalid: (field: string, reason?: string) => new ValidationError(
    `Invalid ${field}${reason ? ': ' + reason : ''}`, 
    field, 
    'INVALID'
  ),
  tooShort: (field: string, minLength: number) => new ValidationError(
    `${field} must be at least ${minLength} characters`,
    field,
    'TOO_SHORT'
  ),
  tooLong: (field: string, maxLength: number) => new ValidationError(
    `${field} must be less than ${maxLength} characters`,
    field,
    'TOO_LONG'
  ),
  
  // Resources
  userNotFound: () => new NotFoundError('User', 'USER_NOT_FOUND'),
  directoryNotFound: () => new NotFoundError('Directory', 'DIRECTORY_NOT_FOUND'),
  submissionNotFound: () => new NotFoundError('Submission', 'SUBMISSION_NOT_FOUND'),
  
  // Business Logic
  duplicateSubmission: () => new ApiError(
    'Submission already exists for this business and directory',
    409,
    'DUPLICATE_SUBMISSION'
  ),
  directoryInactive: () => new ApiError(
    'Directory is currently inactive',
    422,
    'DIRECTORY_INACTIVE'
  ),
  submissionLimitReached: (limit: number) => new ApiError(
    `Maximum submissions per day reached: ${limit}`,
    429,
    'SUBMISSION_LIMIT_REACHED'
  ),
  
  // External Services
  paymentFailed: (reason: string) => new ExternalServiceError(
    'Stripe',
    `Payment failed: ${reason}`,
    undefined,
    'PAYMENT_FAILED'
  ),
  scrapingFailed: (url: string, reason: string) => new ExternalServiceError(
    'Web Scraper',
    `Failed to scrape ${url}: ${reason}`,
    undefined,
    'SCRAPING_FAILED'
  ),
  
  // Database
  connectionFailed: () => new DatabaseError('Database connection failed', undefined, 'CONNECTION_FAILED'),
  queryFailed: (query: string, error: Error) => new DatabaseError(
    `Query failed: ${error.message}`,
    query,
    'QUERY_FAILED'
  ),
  
  // Rate Limiting
  rateLimitExceeded: (resetTime: number) => new RateLimitError(resetTime),
  apiKeyInvalid: () => new AuthenticationError('Invalid API key', 'INVALID_API_KEY'),
  apiKeyExpired: () => new AuthenticationError('API key has expired', 'API_KEY_EXPIRED'),
  apiKeyRateLimited: (resetTime: number) => new RateLimitError(resetTime)
} as const

// Error logger utility
export function logError(error: Error, context: Record<string, any> = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: 'ERROR',
    message: error.message,
    name: error.name,
    stack: error.stack,
    context,
    ...(error instanceof AppError && {
      statusCode: error.statusCode,
      errorCode: error.errorCode,
      isOperational: error.isOperational
    })
  }
  
  console.error(JSON.stringify(logEntry, null, 2))
  
  // In production, you'd send this to your logging service
  // await sendToLoggingService(logEntry)
}