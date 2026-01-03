import { z } from 'zod';
import { paginationSchema } from '@/utils/pagination';
import { AttendanceStatus } from '@prisma/client';

// =========================================================================
// 1. INPUT SCHEMAS
// =========================================================================

export const clockInSchema = {
    body: z.object({
        gpsCoords: z.object({
            latitude: z.number().min(-90).max(90).optional(),
            longitude: z.number().min(-180).max(180).optional()
        }).optional(),
        method: z.string().optional().default('WEB'),
        // Admin override for manual entry could be added here later (e.g. employeeId)
    })
};

export const clockOutSchema = {
    body: z.object({
        gpsCoords: z.object({
            latitude: z.number().min(-90).max(90).optional(),
            longitude: z.number().min(-180).max(180).optional()
        }).optional(),
        method: z.string().optional().default('WEB'),
    })
};

export const manualEntrySchema = {
    body: z.object({
        employeeId: z.string().uuid(),
        date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
        checkIn: z.string().datetime(),
        checkOut: z.string().datetime().optional(),
        status: z.nativeEnum(AttendanceStatus).optional(),
        remarks: z.string().optional(),
    }).refine(data => {
        if (data.checkOut && new Date(data.checkOut) <= new Date(data.checkIn)) {
            return false;
        }
        return true;
    }, {
        message: "Check-out time must be after check-in time",
        path: ["checkOut"]
    })
};

// =========================================================================
// 2. QUERY SCHEMAS
// =========================================================================

export const getAttendanceQuerySchema = {
    query: paginationSchema.extend({
        employeeId: z.string().uuid().optional(),
        status: z.nativeEnum(AttendanceStatus).optional(),
        startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
        endDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
        // Shortcuts
        date: z.string().optional(), // Specific day
        month: z.string().regex(/^\d{1,2}$/).transform(Number).optional(),
        year: z.string().regex(/^\d{4}$/).transform(Number).optional()
    })
};

// =========================================================================
// TYPES (Inferred)
// =========================================================================

export type ClockInInput = z.infer<typeof clockInSchema.body>;
export type ClockOutInput = z.infer<typeof clockOutSchema.body>;
export type ManualEntryInput = z.infer<typeof manualEntrySchema.body>;
export type GetAttendanceQuery = z.infer<typeof getAttendanceQuerySchema.query>;
