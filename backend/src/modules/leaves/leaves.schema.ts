import { z } from 'zod';
import { LeaveType, LeaveStatus } from '@prisma/client';
import { paginationSchema } from '@/utils/pagination';

// =========================================================================
// LEAVE GRADES
// =========================================================================

export const createLeaveGradeSchema = {
    body: z.object({
        name: z.string().min(1, 'Name is required').max(100),
    }),
};

export const updateLeaveGradeSchema = {
    body: z.object({
        name: z.string().min(1).max(100).optional(),
    }),
};

export const leaveGradeIdSchema = {
    params: z.object({
        gradeId: z.string().uuid(),
    }),
};

export const leaveGradeQuerySchema = {
    query: paginationSchema.extend({
        sortBy: z.enum(['name', 'createdAt']).optional(),
    }),
};

// =========================================================================
// LEAVE POLICIES
// =========================================================================

export const createLeavePolicySchema = {
    body: z.object({
        leaveType: z.nativeEnum(LeaveType),
        totalDays: z.number().min(0),
        carryForward: z.boolean().optional().default(false),
        maxCarryAmount: z.number().min(0).optional().default(0),
    }),
};

export const updateLeavePolicySchema = {
    body: z.object({
        leaveType: z.nativeEnum(LeaveType).optional(),
        totalDays: z.number().min(0).optional(),
        carryForward: z.boolean().optional(),
        maxCarryAmount: z.number().min(0).optional(),
    }),
};

export const policyIdSchema = {
    params: z.object({
        policyId: z.string().uuid(),
    }),
};

// =========================================================================
// LEAVE REQUESTS
// =========================================================================

export const createLeaveRequestSchema = {
    body: z.object({
        startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
        endDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
        type: z.nativeEnum(LeaveType),
        reason: z.string().max(500, "Reason must be 500 characters or less").optional(),
        dayDetails: z.any().optional(),
    }).refine(data => new Date(data.endDate) >= new Date(data.startDate), {
        message: "End date must be after or equal to start date",
        path: ["endDate"]
    }),
};

export const updateLeaveRequestStatusSchema = {
    body: z.object({
        status: z.nativeEnum(LeaveStatus),
    }),
};

export const leaveRequestIdSchema = {
    params: z.object({
        requestId: z.string().uuid(),
    }),
};

export const leaveRequestQuerySchema = {
    query: paginationSchema.extend({
        employeeId: z.string().uuid().optional(),
        status: z.nativeEnum(LeaveStatus).optional(),
        type: z.nativeEnum(LeaveType).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        sortBy: z.enum(['startDate', 'endDate', 'type', 'status', 'createdAt']).optional(),
    }),
};

// =========================================================================
// TYPES (Inferred)
// =========================================================================

export type CreateLeaveGradeInput = z.infer<typeof createLeaveGradeSchema.body>;
export type UpdateLeaveGradeInput = z.infer<typeof updateLeaveGradeSchema.body>;
export type CreateLeavePolicyInput = z.infer<typeof createLeavePolicySchema.body>;
export type UpdateLeavePolicyInput = z.infer<typeof updateLeavePolicySchema.body>;
export type CreateLeaveRequestInput = z.infer<typeof createLeaveRequestSchema.body>;
export type UpdateLeaveRequestStatusInput = z.infer<typeof updateLeaveRequestStatusSchema.body>;
export type LeaveRequestQuery = z.infer<typeof leaveRequestQuerySchema.query>;
export type LeaveGradeQuery = z.infer<typeof leaveGradeQuerySchema.query>;

// Response DTOs
import { PaginatedResponse } from '@/utils/pagination';

export interface LeaveGradeResponseDto {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}

export type LeaveGradeListResponseDto = PaginatedResponse<LeaveGradeResponseDto>;

export interface LeaveRequestResponseDto {
    id: string;
    startDate: Date;
    endDate: Date;
    type: LeaveType;
    status: LeaveStatus;
    reason?: string;
    employee: {
        firstName: string;
        lastName: string;
    };
}

export type LeaveRequestListResponseDto = PaginatedResponse<LeaveRequestResponseDto>;
