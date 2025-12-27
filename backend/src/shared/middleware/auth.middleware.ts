import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config';

const JWT_SECRET = config.jwt.secret;

/**
 * User payload from JWT token
 */
export interface JwtPayload {
    id: string;
    email: string;
    role: string;
    employeeId?: string;
    companyId?: string;
}

/**
 * Extended Express Request with user
 */
export interface AuthRequest extends Request {
    user?: JwtPayload;
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const authMiddleware = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: 'No token provided',
            });
            return;
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

        // Attach user to request
        req.user = decoded;

        next();
    } catch (error: any) {
        if (error.name === 'JsonWebTokenError') {
            res.status(401).json({
                success: false,
                error: 'Invalid token',
            });
            return;
        }

        if (error.name === 'TokenExpiredError') {
            res.status(401).json({
                success: false,
                error: 'Token expired',
            });
            return;
        }

        res.status(500).json({
            success: false,
            error: 'Authentication failed',
        });
    }
};

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't fail if no token
 */
export const optionalAuthMiddleware = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
            req.user = decoded;
        }

        next();
    } catch (error) {
        // Silently fail for optional auth
        next();
    }
};

/**
 * Role-based authorization middleware factory
 */
export const requireRole = (...allowedRoles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Not authenticated',
            });
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                error: 'Insufficient permissions',
            });
            return;
        }

        next();
    };
};

/**
 * Company-based authorization middleware
 * Ensures user belongs to the specified company
 */
export const requireCompany = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            error: 'Not authenticated',
        });
        return;
    }

    const companyId = req.params.companyId || req.body.companyId;

    if (!companyId) {
        res.status(400).json({
            success: false,
            error: 'Company ID required',
        });
        return;
    }

    if (req.user.companyId !== companyId) {
        res.status(403).json({
            success: false,
            error: 'Access denied to this company',
        });
        return;
    }

    next();
};

// Export for backward compatibility
export const authGuard = authMiddleware;
