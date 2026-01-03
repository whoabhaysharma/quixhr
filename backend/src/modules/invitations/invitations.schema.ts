import { z } from 'zod';
import { Role } from '@prisma/client';

// =========================================================================
// VALIDATION SCHEMAS
// =========================================================================

/**
 * Create invitation schema
 */
export const createInvitationSchema = {
    body: z.object({
        email: z.string().email('Invalid email format'),
        role: z.nativeEnum(Role),
    }),
};

/**
 * Accept invitation schema
 */
export const acceptInvitationSchema = {
    body: z.object({
        token: z.string().min(1, 'Token is required'),
        firstName: z.string().min(1, 'First name is required'),
        lastName: z.string().min(1, 'Last name is required'),
        password: z.string().min(8, 'Password must be at least 8 characters'),
    }),
};

/**
 * Resend invitation schema
 */
export const resendInvitationSchema = {
    params: z.object({
        invitationId: z.string().uuid(),
    }),
};

/**
 * Cancel invitation schema
 */
export const cancelInvitationSchema = {
    params: z.object({
        invitationId: z.string().uuid(),
    }),
};

/**
 * Get invitations query schema
 */
export const getInvitationsSchema = {
    query: z.object({
        status: z.string().optional(),
        email: z.string().optional(),
        page: z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    }),
};

/**
 * Verify invitation token schema
 */
export const verifyInvitationSchema = {
    params: z.object({
        token: z.string().min(1),
    }),
};

// =========================================================================
// RESPONSE DTOs
// =========================================================================

export interface InvitationResponseDto {
    id: string;
    organizationId: string;
    email: string;
    role: Role;
    status: string;
    expiresAt: Date;
    createdAt?: Date;
}

export interface InvitationsListResponseDto {
    success: boolean;
    message: string;
    data: {
        invitations: InvitationResponseDto[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    };
}

export interface InvitationDetailsResponseDto {
    success: boolean;
    message: string;
    data: {
        email: string;
        role: Role;
        organizationName: string;
        expiresAt: Date;
    };
}
