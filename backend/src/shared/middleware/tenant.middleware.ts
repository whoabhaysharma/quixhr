import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { TokenPayload } from '@/modules/auth/auth.types';

// ============================================================================
// TYPE DECLARATIONS
// ============================================================================
declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
            targetOrganizationId?: string;
        }
    }
}

// ============================================================================
// CONSTANTS
// ============================================================================
const HTTP_STATUS = {
    UNAUTHORIZED: 401,
};

const ERROR_MESSAGES = {
    AUTHENTICATION_REQUIRED: 'Authentication required',
};

// ============================================================================
// MIDDLEWARE EXPORTS
// ============================================================================

/**
 * Resolve Tenant Middleware
 * 
 * Multi-tenant data isolation middleware. Determines which organization's data
 * should be accessed based on user role and request parameters.
 * 
 * Behavior:
 * - SUPER_ADMIN: Can access any organization via:
 *   1. :organizationId param in URL (e.g., /org/:organizationId/employees)
 *   2. ?organizationId=xxx query param
 *   3. View all organizations if no param provided
 * - Others: Strictly limited to their own organization from JWT token
 * 
 * Attaches 'targetOrganizationId' to request object for downstream handlers.
 * Must be preceded by 'protect' middleware to ensure user is authenticated.
 * 
 * @example
 * router.use(protect, resolveTenant); // All routes have tenant context
 * router.get('/:organizationId/employees', protect, resolveTenant, getEmployees);
 */
export const resolveTenant = (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
            status: 'error',
            message: ERROR_MESSAGES.AUTHENTICATION_REQUIRED,
        });
        return;
    }

    // SUPER_ADMIN: Allow organization impersonation via params or query
    if (user.role === Role.SUPER_ADMIN) {
        // Priority: params > query (for nested routes like /org/:organizationId/employees)
        const paramsOrganizationId = req.params.organizationId as string | undefined;
        const queryOrganizationId = req.query.organizationId as string | undefined;
        req.targetOrganizationId = paramsOrganizationId || queryOrganizationId;
    } else {
        // Regular users: Strictly limited to their own organization
        req.targetOrganizationId = user.organizationId;
    }

    next();
};
