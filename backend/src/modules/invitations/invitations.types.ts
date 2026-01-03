import { Role } from '@prisma/client';

// =========================================================================
// INTERNAL TYPES
// =========================================================================

/**
 * Authenticated user context extracted from JWT token
 */
export interface AuthContext {
    userId: string;
    email: string;
    role: Role;
    employeeId?: string;
    organizationId?: string;
}

/**
 * Pagination query parameters
 */
export interface PaginationParams {
    page?: number;
    limit?: number;
}

/**
 * Create invitation input
 */
export interface CreateInvitationInput {
    email: string;
    role: Role;
}

/**
 * Update invitation input
 */
export interface UpdateInvitationInput {
    status?: string;
}

/**
 * Invitation filters
 */
export interface InvitationFilters extends PaginationParams {
    status?: string;
    email?: string;
}
