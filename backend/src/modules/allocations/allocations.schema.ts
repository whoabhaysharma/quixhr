import { z } from 'zod';
import { LeaveType } from '@prisma/client';

// =========================================================================
// VALIDATION SCHEMAS
// =========================================================================

/**
 * Create leave allocation schema
 */
export const createLeaveAllocationSchema = {
    body: z.object({
        employeeId: z.string().uuid().optional(), // Optional when creating via employee route
        year: z.number().int().min(2000).max(2100),
        leaveType: z.nativeEnum(LeaveType),
        allocated: z.number().min(0),
    }),
};


/**
 * Update leave allocation schema
 */
export const updateLeaveAllocationSchema = {
    body: z.object({
        allocated: z.number().min(0).optional(),
        used: z.number().min(0).optional(),
    }),
};

/**
 * Bulk allocate schema
 */
export const bulkAllocateSchema = {
    body: z.object({
        year: z.number().int().min(2000).max(2100),
        leaveGradeId: z.string().uuid().optional(),
        employeeIds: z.array(z.string().uuid()).optional(),
    }),
};

/**
 * Get allocations query schema
 */
export const getAllocationsSchema = {
    query: z.object({
        employeeId: z.string().uuid().optional(),
        year: z.string().regex(/^\d{4}$/).transform(Number).optional(),
        leaveType: z.nativeEnum(LeaveType).optional(),
        page: z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    }),
};

// =========================================================================
// RESPONSE DTOs
// =========================================================================

export interface LeaveAllocationResponseDto {
    id: string;
    employeeId: string;
    year: number;
    leaveType: LeaveType;
    allocated: number;
    used: number;
    remaining: number;
    employee?: {
        id: string;
        firstName: string;
        lastName: string;
        code: string | null;
    };
}

export interface LeaveAllocationsListResponseDto {
    success: boolean;
    message: string;
    data: {
        allocations: LeaveAllocationResponseDto[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    };
}

export interface BulkAllocationResponseDto {
    success: boolean;
    message: string;
    data: {
        allocated: number;
        employees: string[];
    };
}
