import { Request, Response, NextFunction } from 'express';
import { Logger } from '@/utils/logger';

export const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Log the incoming request
    Logger.http('Incoming Request', {
        method: req.method,
        url: req.url,
        query: req.query,
        body: req.body, // User explicitly allowed logging sensitive data
        ip: req.ip,
        headers: {
            'user-agent': req.headers['user-agent'],
            'referer': req.headers['referer'],
        }
    });

    // Capture the start time
    const start = Date.now();

    // Hook into response finish to log the outcome
    res.on('finish', () => {
        const duration = Date.now() - start;
        const message = `Request Completed: ${req.method} ${req.url} ${res.statusCode} ${duration}ms`;

        if (res.statusCode >= 400) {
            Logger.warn(message, {
                statusCode: res.statusCode,
                duration
            });
        } else {
            Logger.http(message, {
                statusCode: res.statusCode,
                duration
            });
        }
    });

    next();
};
