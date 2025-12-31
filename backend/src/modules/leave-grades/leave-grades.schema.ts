import { z } from 'zod';
import { LeaveType } from '@prisma/client';

// =========================================================================
// REQUEST VALIDATION SCHEMAS
// =========================================================================

/**
 * Leave policy schema for nested validation
 */
const leavePolicySchema = z.object({
  leaveType: z.nativeEnum(LeaveType),
  totalDays: z.number().min(0).max(365),
  carryForward: z.boolean().default(false),
  maxCarryAmount: z.number().min(0).max(365).default(0),
});

/**
 * Schema for creating a new leave grade
 */
export const createLeaveGradeSchema = {
  body: z.object({
    name: z.string().min(1, 'Leave grade name is required').max(100),
    policies: z.array(leavePolicySchema).min(1, 'At least one leave policy is required'),
  }),
  params: z.object({
    companyId: z.string().uuid('Invalid company ID'),
  }),
};

/**
 * Schema for updating a leave grade
 */
export const updateLeaveGradeSchema = {
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    policies: z.array(leavePolicySchema).optional(),
  }),
  params: z.object({
    companyId: z.string().uuid('Invalid company ID'),
    leaveGradeId: z.string().uuid('Invalid leave grade ID'),
  }),
};

/**
 * Schema for getting leave grade by ID
 */
export const getLeaveGradeSchema = {
  params: z.object({
    companyId: z.string().uuid('Invalid company ID'),
    leaveGradeId: z.string().uuid('Invalid leave grade ID'),
  }),
};

/**
 * Schema for listing leave grades
 */
export const getLeaveGradesSchema = {
  params: z.object({
    companyId: z.string().uuid('Invalid company ID'),
  }),
  query: z.object({
    page: z.coerce.number().min(1).default(1).optional(),
    limit: z.coerce.number().min(1).max(100).default(20).optional(),
    name: z.string().optional(),
  }),
};

/**
 * Schema for deleting leave grade
 */
export const deleteLeaveGradeSchema = {
  params: z.object({
    companyId: z.string().uuid('Invalid company ID'),
    leaveGradeId: z.string().uuid('Invalid leave grade ID'),
  }),
};

// =========================================================================
// RESPONSE DTOs
// =========================================================================

/**
 * Leave policy response DTO
 */
export interface LeavePolicyResponseDto {
  leaveType: LeaveType;
  totalDays: number;
  carryForward: boolean;
  maxCarryAmount: number;
}

/**
 * Leave grade response DTO
 */
export interface LeaveGradeResponseDto {
  success: boolean;
  message: string;
  data: {
    id: string;
    companyId: string;
    name: string;
    policies: LeavePolicyResponseDto[];
    employeeCount: number;
  };
}

/**
 * Leave grade details response DTO (includes more detailed information)
 */
export interface LeaveGradeDetailsResponseDto {
  success: boolean;
  message: string;
  data: {
    id: string;
    companyId: string;
    name: string;
    policies: Array<{
      id: string;
      leaveType: LeaveType;
      totalDays: number;
      carryForward: boolean;
      maxCarryAmount: number;
    }>;
    employeeCount: number;
    employees?: Array<{
      id: string;
      firstName: string;
      lastName: string;
      fullName: string;
      code?: string;
      status: string;
    }>;
  };
}

/**
 * Leave grades list response DTO
 */
export interface LeaveGradesListResponseDto {
  success: boolean;
  message: string;
  data: {
    leaveGrades: Array<{
      id: string;
      companyId: string;
      name: string;
      policies: LeavePolicyResponseDto[];
      employeeCount: number;
    }>;
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

// =========================================================================
// TYPE EXPORTS FOR REQUEST VALIDATION
// =========================================================================

export type CreateLeaveGradeDto = z.infer<typeof createLeaveGradeSchema.body>;
export type UpdateLeaveGradeDto = z.infer<typeof updateLeaveGradeSchema.body>;
export type GetLeaveGradeParamsDto = z.infer<typeof getLeaveGradeSchema.params>;
export type GetLeaveGradesQueryDto = z.infer<typeof getLeaveGradesSchema.query>;
export type GetLeaveGradesParamsDto = z.infer<typeof getLeaveGradesSchema.params>;
export type LeavePolicyDto = z.infer<typeof leavePolicySchema>;