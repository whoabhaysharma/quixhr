import { z } from 'zod';
import { AttendanceStatus } from '@prisma/client';

export const punchSchema = z.object({
    body: z.object({
        type: z.enum(['IN', 'OUT'], {
            message: 'Type must be either IN or OUT',
        }),
        method: z.enum(['WEB', 'MOBILE', 'BIOMETRIC']).optional().default('WEB'),
        gpsCoords: z.object({
            latitude: z.number().min(-90).max(90),
            longitude: z.number().min(-180).max(180),
        }).optional(),
    }),
});

export const getMySummarySchema = z.object({
    query: z.object({
        month: z.string().regex(/^\d{1,2}$/).optional(),
        year: z.string().regex(/^\d{4}$/).optional(),
    }).optional(),
});

export const getDailyReportSchema = z.object({
    query: z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // YYYY-MM-DD
        status: z.nativeEnum(AttendanceStatus).optional(),
    }).optional(),
});

export const getLogsSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid attendance ID'),
    }),
});

export const regularizeSchema = z.object({
    body: z.object({
        employeeId: z.string().uuid('Invalid employee ID'),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
        status: z.nativeEnum(AttendanceStatus, {
            message: 'Invalid attendance status',
        }),
        checkIn: z.string().datetime().optional(),
        checkOut: z.string().datetime().optional(),
        reason: z.string().min(10, 'Reason must be at least 10 characters'),
    }),
});

export const bulkSyncSchema = z.object({
    body: z.object({
        records: z.array(z.object({
            employeeCode: z.string().min(1, 'Employee code is required'),
            timestamp: z.string().datetime(),
            type: z.enum(['IN', 'OUT']),
            deviceId: z.string().optional(),
        })),
    }),
});
