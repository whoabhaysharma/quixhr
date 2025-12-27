import { Request, Response, NextFunction } from 'express';
import { RateLimiter, RateLimiterOptions } from '../../infra/rate-limit/rate-limiter';
import { KeyGenerator, ipStrategy } from '../../infra/rate-limit/strategies';
import { config } from '../../config';

/**
 * Rate Limit Middleware Options
 */
export interface RateLimitMiddlewareOptions extends Partial<RateLimiterOptions> {
    keyGenerator?: KeyGenerator;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    onLimitReached?: (req: Request, res: Response) => void;
}

/**
 * Create rate limiting middleware
 */
export const createRateLimiter = (options: RateLimitMiddlewareOptions = {}) => {
    // Relax limits in development
    const isDev = config.nodeEnv === 'development' || config.nodeEnv === 'test';
    // Use 10000 as "unlimited" for dev, otherwise use option or default
    const maxRequests = isDev ? 10000 : (options.maxRequests || config.rateLimit.maxRequests);

    const limiter = new RateLimiter({
        windowMs: options.windowMs || config.rateLimit.windowMs,
        maxRequests: maxRequests,
        keyPrefix: 'ratelimit',
    });

    const keyGenerator = options.keyGenerator || ipStrategy;
    const skipSuccessful = options.skipSuccessfulRequests ?? config.rateLimit.skipSuccessfulRequests;
    const skipFailed = options.skipFailedRequests ?? config.rateLimit.skipFailedRequests;

    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const key = keyGenerator(req);
            const result = await limiter.checkLimit(key);

            // Set rate limit headers
            res.setHeader('X-RateLimit-Limit', limiter['maxRequests']);
            res.setHeader('X-RateLimit-Remaining', result.remaining);
            res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

            if (!result.allowed) {
                res.setHeader('Retry-After', Math.ceil((result.resetTime - Date.now()) / 1000));

                if (options.onLimitReached) {
                    options.onLimitReached(req, res);
                    return;
                }

                res.status(429).json({
                    success: false,
                    error: 'Too many requests, please try again later',
                    retryAfter: result.resetTime,
                });
                return;
            }

            // Handle skip options
            if (skipSuccessful || skipFailed) {
                const originalSend = res.send;
                res.send = function (body: any) {
                    const statusCode = res.statusCode;
                    const shouldSkip =
                        (skipSuccessful && statusCode >= 200 && statusCode < 300) ||
                        (skipFailed && statusCode >= 400);

                    if (shouldSkip) {
                        // Decrement counter (not implemented in basic version)
                        // This would require additional Redis operations
                    }

                    return originalSend.call(this, body);
                };
            }

            next();
        } catch (error) {
            console.error('Rate limit middleware error:', error);
            // Fail open - allow request if error occurs
            next();
        }
    };
};

/**
 * Preset: Strict rate limit (10 requests per minute)
 * Use for sensitive operations
 */
export const strictRateLimit = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
});

/**
 * Preset: Moderate rate limit (60 requests per minute)
 * Use for general API endpoints
 */
export const moderateRateLimit = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
});

/**
 * Preset: Lenient rate limit (100 requests per minute)
 * Use for read-heavy endpoints
 */
export const lenientRateLimit = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
});

/**
 * Preset: Auth rate limit (5 requests per minute)
 * Use for authentication endpoints (login, register, password reset)
 */
export const authRateLimit = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
});

/**
 * Preset: API rate limit (1000 requests per hour)
 * Use for general API access
 */
export const apiRateLimit = createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 1000,
});
