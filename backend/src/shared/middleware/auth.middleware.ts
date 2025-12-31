import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { TokenPayload } from '@/modules/auth/auth.types';

// Extend Express Request to include user and targetCompanyId
declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
            targetCompanyId?: string;
        }
    }
}

/**
 * Protect route - Verify JWT token and attach user to request
 * Extracts the token from Authorization header and validates it
 */
export const protect = (req: Request, res: Response, next: NextFunction) => {
    let token;

    // Get token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'Please log in to access this resource' });
    }

    try {
        // Verify JWT token
        const secret = process.env.JWT_SECRET || 'your-secret-key';
        const decoded = jwt.verify(token, secret) as TokenPayload;
        
        // Attach decoded user info to request
        req.user = decoded;
        next();
    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token has expired' });
        }
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

/**
 * Restrict route access by user roles
 * Usage: restrictTo('ORG_ADMIN', 'HR_ADMIN', 'SUPER_ADMIN')
 */
export const restrictTo = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        // Check if user's role is in the allowed roles
        const userRole = req.user.role as string;
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                message: 'You do not have permission to perform this action'
            });
        }

        next();
    };
};
