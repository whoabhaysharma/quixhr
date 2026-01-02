import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { AppError } from './appError';
import { redis } from '@/infra/redis/redis.connection';

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skip: () => {
        return process.env.NODE_ENV === 'test';
    },

    // Use Redis store for distributed rate limiting
    store: new RedisStore({
        // @ts-expect-error - Adapter for ioredis
        sendCommand: (...args: string[]) => redis.call(...args),
        prefix: 'rl:', // Key prefix in Redis
    }),

    handler: (req, res, next, options) => {
        next(new AppError('Too many requests, please try again later.', 429));
    },
    skipSuccessfulRequests: false,
});