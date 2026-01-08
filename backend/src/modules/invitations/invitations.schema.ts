import { z } from 'zod';
import { Role } from '@prisma/client';
import { paginationSchema, PaginatedResponse } from '@/utils/pagination';

// =========================================================================
// INPUT SCHEMAS
// =========================================================================

export const createInvitationSchema = {
    body: z.object({
        email: z.string().email('Invalid email format'),
        role: z.enum(['SUPER_ADMIN', 'ORG_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE']),
    }),
};

export const acceptInvitationSchema = {
    body: z.object({
        token: z.string().min(1, 'Token is required'),
        firstName: z.string().min(1, 'First name is required').max(100),
        lastName: z.string().min(1, 'Last name is required').max(100),
        password: z.string().min(8, 'Password must be at least 8 characters'),
    }),
};

export const invitationIdSchema = {
    params: z.object({
        invitationId: z.string().uuid(),
    }),
};

export const verifyInvitationSchema = {
    params: z.object({
        token: z.string().min(1),
    }),
};

// =========================================================================
// QUERY SCHEMAS
// =========================================================================

export const getInvitationsQuerySchema = {
    query: paginationSchema.extend({
        status: z.enum(['PENDING', 'ACCEPTED', 'CANCELLED', 'EXPIRED']).optional(),
        email: z.string().optional(),
        sortBy: z.enum(['email', 'role', 'status', 'expiresAt', 'createdAt']).optional(),
    }),
};

// =========================================================================
// TYPES (Inferred)
// =========================================================================

export type CreateInvitationInput = z.infer<typeof createInvitationSchema.body>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema.body>;
export type GetInvitationsQuery = z.infer<typeof getInvitationsQuerySchema.query>;

// Response DTOs
export interface InvitationResponseDto {
    id: string;
    organizationId: string;
    email: string;
    role: Role;
    status: string;
    expiresAt: Date;
}

export type InvitationsListResponseDto = PaginatedResponse<InvitationResponseDto>;

export interface InvitationDetailsResponseDto {
    success: boolean;
    message: string;
    data: {
        email: string;
        role: Role;
        organizationName: string;
        organizationId: string;
        expiresAt: Date;
    };
}
