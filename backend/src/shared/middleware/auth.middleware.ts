import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { TokenPayload } from '@/modules/auth/auth.types';

// ============================================================================
// TYPE DECLARATIONS
// ============================================================================
declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
            targetCompanyId?: string;
        }
    }
}

// ============================================================================
// CONSTANTS
// ============================================================================
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const ERROR_MESSAGES = {
    NO_TOKEN: 'Please log in to access this resource',
    INVALID_TOKEN: 'Invalid or expired token',
    EXPIRED_TOKEN: 'Token has expired',
    NOT_AUTHENTICATED: 'User not authenticated',
    INSUFFICIENT_PERMISSIONS: 'You do not have permission to perform this action',
};

const HTTP_STATUS = {
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract JWT token from Authorization header
 * @param authHeader - Authorization header value
 * @returns JWT token or undefined
 */
function extractToken(authHeader: string | undefined): string | undefined {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return undefined;
    }
    return authHeader.split(' ')[1];
}

/**
 * Verify and decode JWT token
 * @param token - JWT token to verify
 * @returns Decoded token payload
 * @throws Error if token is invalid or expired
 */
function verifyToken(token: string): TokenPayload {
    try {
        const secret = process.env.JWT_SECRET || 'your-secret-key';
        return jwt.verify(token, secret) as TokenPayload;
    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            throw new Error(ERROR_MESSAGES.EXPIRED_TOKEN);
        }
        throw new Error(ERROR_MESSAGES.INVALID_TOKEN);
    }
}

// ============================================================================
// MIDDLEWARE EXPORTS
// ============================================================================

/**
 * Protect Middleware
 * 
 * Verifies JWT token from Authorization header and attaches decoded user to request.
 * Must be placed before routes that require authentication.
 * 
 * @example
 * router.use(protect); // Protect all routes
 * router.get('/profile', protect, getProfile); // Protect single route
 */
export const protect = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const token = extractToken(req.headers.authorization);

        if (!token) {
            res.status(HTTP_STATUS.UNAUTHORIZED).json({
                status: 'error',
                message: ERROR_MESSAGES.NO_TOKEN,
            });
            return;
        }

        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (error: any) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
            status: 'error',
            message: error.message || ERROR_MESSAGES.INVALID_TOKEN,
        });
    }
};

/**
 * Restrict To Middleware
 * 
 * Role-based access control (RBAC) middleware.
 * Checks if the authenticated user's role is included in the allowed roles.
 * 
 * @param allowedRoles - Roles that are permitted to access the route
 * @returns Middleware function
 * 
 * @example
 * router.patch('/:id', protect, restrictTo('ADMIN', 'HR_ADMIN'), updateUser);
 */
export const restrictTo = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(HTTP_STATUS.UNAUTHORIZED).json({
                status: 'error',
                message: ERROR_MESSAGES.NOT_AUTHENTICATED,
            });
            return;
        }

        const userRole = req.user.role as string;
        if (!allowedRoles.includes(userRole)) {
            res.status(HTTP_STATUS.FORBIDDEN).json({
                status: 'error',
                message: ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS,
            });
            return;
        }

        next();
    };
};
