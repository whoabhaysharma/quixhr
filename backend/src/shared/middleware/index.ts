/**
 * Shared Middleware Index
 * 
 * Central export point for all middleware
 */

export {
    authMiddleware,
    optionalAuthMiddleware,
    requireRole,
    requireCompany,
    authGuard,
    AuthRequest,
    JwtPayload,
} from './auth.middleware';

export {
    createRateLimiter,
    strictRateLimit,
    moderateRateLimit,
    lenientRateLimit,
    authRateLimit,
    apiRateLimit,
} from './rate-limit.middleware';

