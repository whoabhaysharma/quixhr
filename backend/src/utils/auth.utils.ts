import { Request } from 'express';
import { Role } from '@prisma/client';
import { AppError } from './appError';
import { TokenPayload } from '@/modules/auth/auth.types';

export type AuthContext = TokenPayload;

/**
 * Get auth context from request
 * Ensures user is authenticated.
 * Validates companyId existence unless user is SUPER_ADMIN.
 */
export const getAuthContext = (req: Request): AuthContext => {
    const user = req.user;

    if (!user) {
        throw new AppError('User not authenticated', 401);
    }

    // SUPER_ADMIN might not have a companyId, which is allowed
    if (user.role !== Role.SUPER_ADMIN && !user.companyId) {
        throw new AppError('Company ID not found in token', 401);
    }

    return user;
};
