/**
 * Custom Error Class for the application
 * Extends the built-in Error class to include statusCode and operational flags
 */
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly status: string;
    public readonly isOperational: boolean;

    constructor(message: string, statusCode: number) {
        super(message);

        this.statusCode = statusCode;
        // status is 'fail' for 4xx errors and 'error' for 5xx errors
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

        // Flag to identify known operational errors vs unknown programming bugs
        this.isOperational = true;

        // Captures the stack trace and excludes this constructor from it
        Error.captureStackTrace(this, this.constructor);
    }
}