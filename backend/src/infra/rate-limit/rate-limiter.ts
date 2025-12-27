import { redis } from '../redis/redis.connection';

/**
 * Rate Limiter Options
 */
export interface RateLimiterOptions {
    windowMs: number;        // Time window in milliseconds
    maxRequests: number;     // Maximum requests per window
    keyPrefix?: string;      // Redis key prefix
}

/**
 * Rate Limit Result
 */
export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    totalRequests: number;
}

/**
 * Redis-backed Rate Limiter
 * 
 * Uses sliding window algorithm for accurate rate limiting
 * across distributed systems
 */
export class RateLimiter {
    private windowMs: number;
    private maxRequests: number;
    private keyPrefix: string;

    constructor(options: RateLimiterOptions) {
        this.windowMs = options.windowMs;
        this.maxRequests = options.maxRequests;
        this.keyPrefix = options.keyPrefix || 'ratelimit';
    }

    /**
     * Check if request is allowed
     */
    async checkLimit(identifier: string): Promise<RateLimitResult> {
        const key = `${this.keyPrefix}:${identifier}`;
        const now = Date.now();
        const windowStart = now - this.windowMs;

        try {
            // Remove old entries outside the window
            await redis.zremrangebyscore(key, 0, windowStart);

            // Count requests in current window
            const requestCount = await redis.zcard(key);

            // Check if limit exceeded
            if (requestCount >= this.maxRequests) {
                // Get oldest request timestamp to calculate reset time
                const oldestRequest = await redis.zrange(key, 0, 0, 'WITHSCORES');
                const resetTime = oldestRequest.length > 0
                    ? parseInt(oldestRequest[1]) + this.windowMs
                    : now + this.windowMs;

                return {
                    allowed: false,
                    remaining: 0,
                    resetTime,
                    totalRequests: requestCount,
                };
            }

            // Add current request
            await redis.zadd(key, now, `${now}-${Math.random()}`);

            // Set expiry on key
            await redis.pexpire(key, this.windowMs);

            return {
                allowed: true,
                remaining: this.maxRequests - requestCount - 1,
                resetTime: now + this.windowMs,
                totalRequests: requestCount + 1,
            };
        } catch (error) {
            console.error('Rate limiter error:', error);
            // Fail open - allow request if Redis is down
            return {
                allowed: true,
                remaining: this.maxRequests,
                resetTime: now + this.windowMs,
                totalRequests: 0,
            };
        }
    }

    /**
     * Reset rate limit for identifier
     */
    async reset(identifier: string): Promise<void> {
        const key = `${this.keyPrefix}:${identifier}`;
        await redis.del(key);
    }

    /**
     * Get current usage for identifier
     */
    async getUsage(identifier: string): Promise<RateLimitResult> {
        const key = `${this.keyPrefix}:${identifier}`;
        const now = Date.now();
        const windowStart = now - this.windowMs;

        // Remove old entries
        await redis.zremrangebyscore(key, 0, windowStart);

        // Count requests
        const requestCount = await redis.zcard(key);

        return {
            allowed: requestCount < this.maxRequests,
            remaining: Math.max(0, this.maxRequests - requestCount),
            resetTime: now + this.windowMs,
            totalRequests: requestCount,
        };
    }
}
