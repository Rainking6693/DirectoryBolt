// Temporary module type overrides to accelerate incremental type-cleanup.
// These make commonly-used error classes and the Errors helper permissive so
// we can update call-sites in small batches without the type-check blowing up.

declare module 'lib/utils/errors' {
  export class ValidationError extends Error {
    constructor(...args: any[])
    field?: string
    code?: string
  }

  export class AuthorizationError extends Error {
    constructor(...args: any[])
    errorCode?: string
  }

  export class AuthenticationError extends Error {
    constructor(...args: any[])
    errorCode?: string
  }

  export class RateLimitError extends Error {
    constructor(...args: any[])
    retryAfter?: number
    remaining?: number
  }

  export const Errors: any
  export default Errors
}

// Also provide a permissive ambient declaration for the errors shim
declare module 'lib/utils/errors-shim' {
  import Errors from 'lib/utils/errors'
  export default Errors
  export const ValidationError: any
}
