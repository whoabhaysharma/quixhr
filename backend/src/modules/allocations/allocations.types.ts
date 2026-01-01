import { LeaveType } from '@prisma/client';

// =========================================================================
// INTERNAL TYPES
// =========================================================================

/**
 * Create leave allocation input
 */
export interface CreateLeaveAllocationInput {
    employeeId: string;
    year: number;
    leaveType: LeaveType;
    allocated: number;
}

/**
 * Update leave allocation input
 */
export interface UpdateLeaveAllocationInput {
    allocated?: number;
    used?: number;
}

/**
 * Bulk allocation input
 */
export interface BulkAllocateInput {
    year: number;
    leaveGradeId?: string;
    employeeIds?: string[];
}

/**
 * Leave allocation filters
 */
export interface LeaveAllocationFilters {
    employeeId?: string;
    year?: number;
    leaveType?: LeaveType;
    page?: number;
    limit?: number;
}
