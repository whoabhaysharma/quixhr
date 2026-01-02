import { Request, Response, NextFunction } from 'express';

// ============================================================================
// TYPES
// ============================================================================
interface AppError extends Error {
    statusCode?: number;
    status?: string;
    isOperational?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================
const DEFAULT_STATUS_CODE = 500;
const DEFAULT_STATUS = 'error';
const PROD_ERROR_MESSAGE = 'Something went wrong!';

const ENVIRONMENT = {
    DEVELOPMENT: 'development',
    PRODUCTION: 'production',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Normalize error object with default values
 */
function normalizeError(err: AppError): AppError {
    return {
        ...err,
        message: err.message,
        statusCode: err.statusCode || DEFAULT_STATUS_CODE,
        status: err.status || DEFAULT_STATUS,
        isOperational: err.isOperational ?? false,
    };
}

/**
 * Format error response for development environment
 */
function formatDevError(err: AppError) {
    return {
        status: err.status,
        message: err.message,
        stack: err.stack,
        error: err,
    };
}

/**
 * Format error response for production environment
 */
function formatProdError(err: AppError) {
    return {
        status: err.status,
        message: err.isOperational ? err.message : PROD_ERROR_MESSAGE,
    };
}

// ============================================================================
// MIDDLEWARE EXPORT
// ============================================================================

/**
 * Global Error Handler Middleware
 * 
 * Catches and formats all errors in the application.
 * Must be registered LAST in middleware chain.
 * 
 * - Development: Returns detailed error info including stack trace
 * - Production: Returns user-friendly error messages only
 * 
 * @example
 * app.use(globalErrorHandler); // Register after all other middleware
 */
export const globalErrorHandler = (
    err: AppError,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const normalizedError = normalizeError(err);
    const isDevelopment = process.env.NODE_ENV === ENVIRONMENT.DEVELOPMENT;

    const responseData =
        isDevelopment
            ? formatDevError(normalizedError)
            : formatProdError(normalizedError);

    res.status(normalizedError.statusCode || DEFAULT_STATUS_CODE).json(responseData);
};