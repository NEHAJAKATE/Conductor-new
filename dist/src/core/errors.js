"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityResolutionError = exports.IngestionError = exports.ValidationError = exports.AppError = void 0;
class AppError extends Error {
    code;
    statusCode;
    retryable;
    constructor(message, code, statusCode = 500, retryable = false) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.statusCode = statusCode;
        this.retryable = retryable;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(message, code = 'VALIDATION_FAILED') {
        super(message, code, 400, false);
    }
}
exports.ValidationError = ValidationError;
class IngestionError extends AppError {
    constructor(message, code = 'INGESTION_FAILED', retryable = true) {
        super(message, code, 500, retryable);
    }
}
exports.IngestionError = IngestionError;
class IdentityResolutionError extends AppError {
    constructor(message, code = 'IDENTITY_RESOLUTION_FAILED') {
        super(message, code, 500, false);
    }
}
exports.IdentityResolutionError = IdentityResolutionError;
