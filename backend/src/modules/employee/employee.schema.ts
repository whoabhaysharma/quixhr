import { z } from 'zod';

export const createEmployeeSchema = z.object({
    body: z.object({
        firstName: z.string().min(1, 'First name is required'),
        lastName: z.string().min(1, 'Last name is required'),
        code: z.string().optional(),
        status: z.enum(['ACTIVE', 'INACTIVE', 'PROBATION']).default('ACTIVE'),
        joiningDate: z.string().datetime().or(z.date()),
        calendarId: z.string().uuid().optional(),
        leaveGradeId: z.string().uuid().optional(),
    }),
});

export const updateEmployeeSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
    body: z.object({
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        code: z.string().optional(),
        status: z.enum(['ACTIVE', 'INACTIVE', 'PROBATION']).optional(),
        joiningDate: z.string().datetime().or(z.date()).optional(),
    }),
});

export const assignConfigSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
    body: z.object({
        calendarId: z.string().uuid().optional(),
        leaveGradeId: z.string().uuid().optional(),
    }).refine((data) => data.calendarId || data.leaveGradeId, {
        message: 'At least one of calendarId or leaveGradeId must be provided',
    }),
});

export const updateStatusSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
    body: z.object({
        status: z.enum(['ACTIVE', 'INACTIVE', 'PROBATION']),
    }),
});

export const getEmployeeByIdSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
});

export const listEmployeesSchema = z.object({
    query: z.object({
        status: z.enum(['ACTIVE', 'INACTIVE', 'PROBATION']).optional(),
        dept: z.string().optional(),
    }).optional(),
});

export const importEmployeesSchema = z.object({
    body: z.object({
        employees: z.array(z.object({
            firstName: z.string().min(1),
            lastName: z.string().min(1),
            email: z.string().email(),
            code: z.string().optional(),
            joiningDate: z.string(),
            status: z.enum(['ACTIVE', 'INACTIVE', 'PROBATION']).optional(),
        })),
    }),
});
