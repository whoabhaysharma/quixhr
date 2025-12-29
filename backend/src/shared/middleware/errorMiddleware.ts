export const globalErrorHandler = (err: any, req: any, res: any, next: any) => {
    // 1. Set default values
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // 2. Distinguish between environments
    if (process.env.NODE_ENV === 'development') {
        // Detailed error for the developer
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
            stack: err.stack,
            error: err
        });
    } else {
        // Clean, user-friendly error for production
        res.status(err.statusCode).json({
            status: err.status,
            message: err.isOperational ? err.message : 'Something went wrong!'
        });
    }
};