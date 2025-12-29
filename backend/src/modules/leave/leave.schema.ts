import { z } from 'zod';
import { LeaveStatus, LeaveType } from '@prisma/client';

export const getMyBalancesSchema = z.object({
    // No params needed - uses authenticated user
});

export const applyLeaveSchema = z.object({
    body: z.object({
        leaveType: z.nativeEnum(LeaveType, { message: 'Invalid leave type' }),
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
        endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format'),
        reason: z.string().min(10, 'Reason must be at least 10 characters'),
        isHalfDay: z.boolean().optional().default(false),
    }).refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
        message: 'End date must be on or after start date',
        path: ['endDate'],
    }),
});

export const listRequestsSchema = z.object({
    query: z.object({
        status: z.nativeEnum(LeaveStatus).optional(),
        employeeId: z.string().uuid().optional(),
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    }).optional(),
});

export const approveRejectSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid leave request ID'),
    }),
    body: z.object({
        status: z.enum(['APPROVED', 'REJECTED'], {
            message: 'Status must be either APPROVED or REJECTED',
        }),
        remarks: z.string().optional(),
    }),
});

export const cancelRequestSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid leave request ID'),
    }),
});

export const getLedgerSchema = z.object({
    params: z.object({
        employeeId: z.string().uuid('Invalid employee ID'),
    }),
    query: z.object({
        leaveType: z.nativeEnum(LeaveType).optional(),
    }).optional(),
});

export const adjustLeaveSchema = z.object({
    body: z.object({
        employeeId: z.string().uuid('Invalid employee ID'),
        leaveType: z.nativeEnum(LeaveType, { message: 'Invalid leave type' }),
        amount: z.number().int().refine((val) => val !== 0, {
            message: 'Amount cannot be zero',
        }),
        reason: z.string().min(10, 'Reason must be at least 10 characters'),
        effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    }),
});

export const importLeavesSchema = z.object({
    body: z.object({
        records: z.array(z.object({
            employeeCode: z.string().min(1, 'Employee code is required'),
            leaveType: z.nativeEnum(LeaveType, { message: 'Invalid leave type' }),
            allocated: z.number().min(0, 'Allocated must be non-negative'),
            used: z.number().min(0, 'Used must be non-negative').optional().default(0),
            year: z.number().int().min(2000).max(2100),
        })),
    }),
});
