import { z } from 'zod';
import { LeaveType, LeaveStatus } from '@prisma/client';

// --- Leave Grades ---
export const createLeaveGradeSchema = {
    body: z.object({
        name: z.string().min(1, 'Name is required'),
    }),
};

export const updateLeaveGradeSchema = {
    params: z.object({
        gradeId: z.string().uuid().optional(),
        id: z.string().uuid().optional()
    }),
    body: z.object({
        name: z.string().optional(),
    }),
};

export const leaveGradeQuerySchema = {
    query: z.object({
        companyId: z.string().uuid().optional(),
        page: z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: z.string().regex(/^\d+$/).transform(Number).optional(),
        search: z.string().optional(),
    }),
};

// --- Leave Policies ---
export const createLeavePolicySchema = {
    body: z.object({
        leaveType: z.nativeEnum(LeaveType),
        totalDays: z.number().min(0),
        carryForward: z.boolean().optional(),
        maxCarryAmount: z.number().min(0).optional(),
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

// --- Leave Requests ---
export const createLeaveRequestSchema = {
    body: z.object({
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
        type: z.nativeEnum(LeaveType),
        reason: z.string().optional(),
        dayDetails: z.any().optional(), // Can refine this schema based on complex logic needs
    }),
};

export const updateLeaveRequestStatusSchema = {
    body: z.object({
        status: z.nativeEnum(LeaveStatus),
    }),
};

export const leaveRequestQuerySchema = {
    query: z.object({
        employeeId: z.string().uuid().optional(),
        companyId: z.string().uuid().optional(), // For Admin to view all requests in company
        status: z.nativeEnum(LeaveStatus).optional(),
        type: z.nativeEnum(LeaveType).optional(),
        page: z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    }),
};
