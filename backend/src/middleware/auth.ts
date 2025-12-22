import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

interface TokenPayload {
    id: number;
    role: Role;
    organizationId?: number; // Optional until onboarding is complete
    iat: number;
    exp: number;
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        res.status(401).json({ success: false, error: { message: 'No token provided' } });
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as TokenPayload;
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ success: false, error: { message: 'Invalid token' } });
    }
};

export const authorize = (...roles: Role[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            res.status(401).json({ success: false, error: { message: 'User not authenticated' } });
            return;
        }

        if (!roles.includes(req.user.role)) {
            res.status(403).json({ success: false, error: { message: 'Forbidden: Insufficient permissions' } });
            return;
        }

        next();
    };
};
