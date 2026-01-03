import { z } from 'zod';
import { LeaveType } from '@prisma/client';
import { paginationSchema } from '@/utils/pagination';

// =========================================================================
// INPUT SCHEMAS
// =========================================================================

export const createLeaveAllocationSchema = {
    body: z.object({
        employeeId: z.string().uuid().optional(), // Optional when creating via employee route
        year: z.number().int().min(2000).max(2100),
        leaveType: z.nativeEnum(LeaveType),
        allocated: z.number().min(0),
    }),
};

export const updateLeaveAllocationSchema = {
    body: z.object({
        allocated: z.number().min(0).optional(),
        used: z.number().min(0).optional(),
    }),
};

export const bulkAllocateSchema = {
    body: z.object({
        year: z.number().int().min(2000).max(2100),
        leaveGradeId: z.string().uuid().optional(),
        employeeIds: z.array(z.string().uuid()).optional(),
    }),
};

export const allocationIdSchema = {
    params: z.object({
        allocationId: z.string().uuid(),
    }),
};

// =========================================================================
// QUERY SCHEMAS
// =========================================================================

export const getAllocationsQuerySchema = {
    query: paginationSchema.extend({
        employeeId: z.string().uuid().optional(),
        year: z.string().regex(/^\d{4}$/).transform(Number).optional(),
        leaveType: z.nativeEnum(LeaveType).optional(),
        sortBy: z.enum(['year', 'leaveType', 'allocated', 'used', 'createdAt']).optional(),
    }),
};

// =========================================================================
// TYPES (Inferred)
// =========================================================================

export type CreateLeaveAllocationInput = z.infer<typeof createLeaveAllocationSchema.body>;
export type UpdateLeaveAllocationInput = z.infer<typeof updateLeaveAllocationSchema.body>;
export type BulkAllocateInput = z.infer<typeof bulkAllocateSchema.body>;
export type GetAllocationsQuery = z.infer<typeof getAllocationsQuerySchema.query>;
