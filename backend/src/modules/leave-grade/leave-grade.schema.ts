import { z } from 'zod';
import { LeaveType } from '@prisma/client';

export const listLeaveGradesSchema = z.object({
    // No params needed
});

export const createLeaveGradeSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Grade name is required').max(100, 'Name too long'),
    }),
});

export const getLeaveGradeSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid leave grade ID'),
    }),
});

export const createLeavePolicySchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid leave grade ID'),
    }),
    body: z.object({
        leaveType: z.nativeEnum(LeaveType, { message: 'Invalid leave type' }),
        totalDays: z.number().min(0, 'Total days must be non-negative').max(365, 'Total days cannot exceed 365'),
        carryForward: z.boolean().optional().default(false),
        maxCarryAmount: z.number().min(0, 'Max carry amount must be non-negative').optional().default(0),
    }).refine((data) => {
        // If carryForward is false, maxCarryAmount should be 0
        if (!data.carryForward && data.maxCarryAmount && data.maxCarryAmount > 0) {
            return false;
        }
        // If carryForward is true and maxCarryAmount is set, it should not exceed totalDays
        if (data.carryForward && data.maxCarryAmount && data.maxCarryAmount > data.totalDays) {
            return false;
        }
        return true;
    }, {
        message: 'Invalid carry forward configuration: maxCarryAmount should be 0 when carryForward is false, and should not exceed totalDays when enabled',
        path: ['maxCarryAmount'],
    }),
});

export const updateLeavePolicySchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid leave grade ID'),
        pid: z.string().uuid('Invalid policy ID'),
    }),
    body: z.object({
        totalDays: z.number().min(0).max(365).optional(),
        carryForward: z.boolean().optional(),
        maxCarryAmount: z.number().min(0).optional(),
    }).refine((data) => {
        // If both carryForward and maxCarryAmount are provided, validate
        if (data.carryForward === false && data.maxCarryAmount && data.maxCarryAmount > 0) {
            return false;
        }
        if (data.totalDays && data.maxCarryAmount && data.maxCarryAmount > data.totalDays) {
            return false;
        }
        return true;
    }, {
        message: 'Invalid carry forward configuration',
        path: ['maxCarryAmount'],
    }),
});

export const deleteLeavePolicySchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid leave grade ID'),
        pid: z.string().uuid('Invalid policy ID'),
    }),
});
