import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { TokenPayload } from '@/modules/auth/auth.types';

/**
 * Middleware to resolve which company's data should be accessed.
 * Injects 'targetCompanyId' into the request object.
 */
export const resolveTenant = (req: Request, res: Response, next: NextFunction) => {
    const user = req.user; // Attached by 'protect' middleware

    if (!user) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    // 1. If Super Admin, they can "impersonate" a company via query param
    if (user.role === Role.SUPER_ADMIN) {
        const queryCompanyId = req.query.companyId as string;

        // If queryCompanyId exists, we lock to that. If not, it stays undefined (Global View)
        req.targetCompanyId = queryCompanyId || undefined;
    } else {
        // 2. For everyone else, strictly enforce their own companyId from JWT
        req.targetCompanyId = user.companyId;
    }

    next();
};


declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
            targetCompanyId?: string; // Add this line
        }
    }
}