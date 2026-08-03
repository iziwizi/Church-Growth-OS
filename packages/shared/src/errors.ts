// Base application error class
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly details?: unknown
  ) {
    super(message)
    this.name = this.constructor.name
    if ('captureStackTrace' in Error && typeof (Error as unknown as { captureStackTrace?: Function }).captureStackTrace === 'function') {
      (Error as unknown as { captureStackTrace: (target: object, constructor: Function) => void }).captureStackTrace(this, this.constructor)
    }
  }
}

// Authentication errors
export class AuthError extends AppError {
  constructor(message: string, code = 'AUTH_ERROR') {
    super(message, code, 401)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 403)
  }
}

// Tenant errors
export class TenantNotFoundError extends AppError {
  constructor(slug: string) {
    super(`Church with slug '${slug}' not found`, 'TENANT_NOT_FOUND', 404)
  }
}

export class TenantSuspendedError extends AppError {
  constructor() {
    super('This church account is currently suspended', 'TENANT_SUSPENDED', 403)
  }
}

// Validation errors
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details)
  }
}

// Not found errors
export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} with id '${id}' not found`, 'NOT_FOUND', 404)
  }
}

// Rate limit errors
export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT_EXCEEDED', 429)
  }
}

// Provider errors
export class ProviderError extends AppError {
  constructor(provider: string, message: string) {
    super(`Provider ${provider} error: ${message}`, 'PROVIDER_ERROR', 502)
  }
}

// AI errors
export class AIError extends AppError {
  constructor(message: string, provider?: string) {
    super(
      provider ? `AI Provider ${provider}: ${message}` : message,
      'AI_ERROR',
      502
    )
  }
}

// Feature not available errors
export class FeatureNotAvailableError extends AppError {
  constructor(feature: string) {
    super(
      `Feature '${feature}' is not available on your current plan`,
      'FEATURE_NOT_AVAILABLE',
      403
    )
  }
}

// Conflict errors
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409)
  }
}
