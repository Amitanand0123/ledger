/**
 * Base API Error class with HTTP status code
 */
export class ApiError extends Error {
    public statusCode: number;
    public isOperational: boolean;

    constructor(statusCode: number, message: string, isOperational = true, stack = '') {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

/**
 * 400 Bad Request - Invalid input or validation error
 */
export class ValidationError extends ApiError {
    constructor(message: string = 'Validation failed') {
        super(400, message);
        this.name = 'ValidationError';
    }
}

/**
 * 401 Unauthorized - Authentication required
 */
export class UnauthorizedError extends ApiError {
    constructor(message: string = 'Authentication required') {
        super(401, message);
        this.name = 'UnauthorizedError';
    }
}

/**
 * 403 Forbidden - Insufficient permissions
 */
export class ForbiddenError extends ApiError {
    constructor(message: string = 'Access forbidden') {
        super(403, message);
        this.name = 'ForbiddenError';
    }
}

/**
 * 404 Not Found - Resource not found
 */
export class NotFoundError extends ApiError {
    constructor(resource: string = 'Resource') {
        super(404, `${resource} not found`);
        this.name = 'NotFoundError';
    }
}

/**
 * 409 Conflict - Resource conflict (e.g., duplicate entry)
 */
export class ConflictError extends ApiError {
    constructor(message: string = 'Resource conflict') {
        super(409, message);
        this.name = 'ConflictError';
    }
}

/**
 * 422 Unprocessable Entity - Request well-formed but semantically invalid
 */
export class UnprocessableEntityError extends ApiError {
    constructor(message: string = 'Unprocessable entity') {
        super(422, message);
        this.name = 'UnprocessableEntityError';
    }
}

/**
 * 500 Internal Server Error - Unexpected server error
 */
export class InternalServerError extends ApiError {
    constructor(message: string = 'Internal server error', isOperational = false) {
        super(500, message, isOperational);
        this.name = 'InternalServerError';
    }
}

/**
 * 503 Service Unavailable - Service temporarily unavailable
 */
export class ServiceUnavailableError extends ApiError {
    constructor(message: string = 'Service temporarily unavailable') {
        super(503, message);
        this.name = 'ServiceUnavailableError';
    }
}

// Default export for backward compatibility
export default ApiError;