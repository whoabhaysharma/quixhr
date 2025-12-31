import { z } from 'zod';
import { Role } from '@prisma/client';

// =========================================================================
// REQUEST VALIDATION SCHEMAS
// =========================================================================

/**
 * Schema for creating a new invitation
 */
export const createInvitationSchema = {
  body: z.object({
    email: z.string().email('Invalid email format'),
    role: z.nativeEnum(Role).default(Role.EMPLOYEE),
    expiresInHours: z.number().min(1).max(168).default(72).optional(), // 1 hour to 1 week
  }),
  params: z.object({
    companyId: z.string().uuid('Invalid company ID'),
  }),
};

/**
 * Schema for accepting an invitation
 */
export const acceptInvitationSchema = {
  body: z.object({
    token: z.string().min(1, 'Token is required'),
    firstName: z.string().min(1, 'First name is required').max(50),
    lastName: z.string().min(1, 'Last name is required').max(50),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    employeeCode: z.string().max(20).optional(),
    joiningDate: z.string().datetime().or(z.date()).optional(),
    calendarId: z.string().uuid().optional(),
    leaveGradeId: z.string().uuid().optional(),
  }),
};

/**
 * Schema for getting invitation by token
 */
export const getInvitationSchema = {
  params: z.object({
    token: z.string().min(1, 'Token is required'),
  }),
};

/**
 * Schema for listing invitations
 */
export const getInvitationsSchema = {
  params: z.object({
    companyId: z.string().uuid('Invalid company ID'),
  }),
  query: z.object({
    page: z.coerce.number().min(1).default(1).optional(),
    limit: z.coerce.number().min(1).max(100).default(20).optional(),
    email: z.string().optional(),
    role: z.nativeEnum(Role).optional(),
    status: z.string().optional(),
  }),
};

/**
 * Schema for resending an invitation
 */
export const resendInvitationSchema = {
  params: z.object({
    companyId: z.string().uuid('Invalid company ID'),
    invitationId: z.string().uuid('Invalid invitation ID'),
  }),
};

/**
 * Schema for canceling an invitation
 */
export const cancelInvitationSchema = {
  params: z.object({
    companyId: z.string().uuid('Invalid company ID'),
    invitationId: z.string().uuid('Invalid invitation ID'),
  }),
};

// =========================================================================
// RESPONSE DTOs
// =========================================================================

/**
 * Invitation response DTO
 */
export interface InvitationResponseDto {
  success: boolean;
  message: string;
  data: {
    id: string;
    companyId: string;
    email: string;
    role: Role;
    status: string;
    expiresAt: Date;
    createdAt: Date;
  };
}

/**
 * Invitations list response DTO
 */
export interface InvitationsListResponseDto {
  success: boolean;
  message: string;
  data: {
    invitations: Array<{
      id: string;
      companyId: string;
      email: string;
      role: Role;
      status: string;
      expiresAt: Date;
      createdAt: Date;
    }>;
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

/**
 * Invitation details response DTO (with token for acceptance)
 */
export interface InvitationDetailsResponseDto {
  success: boolean;
  message: string;
  data: {
    id: string;
    companyId: string;
    companyName: string;
    email: string;
    role: Role;
    status: string;
    expiresAt: Date;
    createdAt: Date;
  };
}

/**
 * Invitation acceptance response DTO
 */
export interface InvitationAcceptanceResponseDto {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      email: string;
      role: Role;
      isEmailVerified: boolean;
    };
    employee: {
      id: string;
      firstName: string;
      lastName: string;
      fullName: string;
      code?: string;
      status: string;
      joiningDate: Date;
    };
    company: {
      id: string;
      name: string;
    };
    token: string; // JWT token for immediate login
  };
}

// =========================================================================
// TYPE EXPORTS FOR REQUEST VALIDATION
// =========================================================================

export type CreateInvitationDto = z.infer<typeof createInvitationSchema.body>;
export type AcceptInvitationDto = z.infer<typeof acceptInvitationSchema.body>;
export type GetInvitationParamsDto = z.infer<typeof getInvitationSchema.params>;
export type GetInvitationsQueryDto = z.infer<typeof getInvitationsSchema.query>;
export type GetInvitationsParamsDto = z.infer<typeof getInvitationsSchema.params>;