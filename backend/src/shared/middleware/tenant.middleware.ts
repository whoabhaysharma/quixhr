import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { TokenPayload } from '@/modules/auth/auth.types';

/**
 * Resolve Tenant - Determine which company's data should be accessed
 * Injects 'targetCompanyId' into the request object for data isolation
 * 
 * Rules:
 * - SUPER_ADMIN: Can access any company via query param (?companyId=xxx)
 * - Others: Strictly limited to their own company from JWT
 * 
 * Usage: router.use(resolveTenant, handler);
 */
export const resolveTenant = (req: Request, res: Response, next: NextFunction) => {
    const user = req.user; // Attached by 'protect' middleware

    if (!user) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    // SUPER_ADMIN can impersonate other companies via query param
    if (user.role === Role.SUPER_ADMIN) {
        const queryCompanyId = req.query.companyId as string;
        // Lock to query company if provided, otherwise undefined (global view)
        req.targetCompanyId = queryCompanyId || undefined;
    } else {
        // For everyone else, strictly enforce their own company from JWT
        req.targetCompanyId = user.companyId;
    }

    next();
};

declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
            targetCompanyId?: string;
        }
    }
}
