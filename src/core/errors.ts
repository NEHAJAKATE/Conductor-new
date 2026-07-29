export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly retryable: boolean;

  constructor(message: string, code: string, statusCode = 500, retryable = false) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.retryable = retryable;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, code = 'VALIDATION_FAILED') {
    super(message, code, 400, false);
  }
}

export class IngestionError extends AppError {
  constructor(message: string, code = 'INGESTION_FAILED', retryable = true) {
    super(message, code, 500, retryable);
  }
}

export class IdentityResolutionError extends AppError {
  constructor(message: string, code = 'IDENTITY_RESOLUTION_FAILED') {
    super(message, code, 500, false);
  }
}
