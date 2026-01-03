import { z } from 'zod';
import { WeeklyRuleType, RuleStrategy } from '@prisma/client';
import { paginationSchema } from '@/utils/pagination';

// =========================================================================
// 1. CALENDAR SCHEMAS
// =========================================================================

export const createCalendarSchema = {
    body: z.object({
        name: z.string().min(1, 'Name is required').max(100),
        dayStartTime: z.number().int().min(0).max(1440), // Minutes from midnight
        dayEndTime: z.number().int().min(0).max(1440),
    }),
};

export const updateCalendarSchema = {
    params: z.object({
        id: z.string().uuid(),
    }),
    body: z.object({
        name: z.string().min(1).max(100).optional(),
        dayStartTime: z.number().int().min(0).max(1440).optional(),
        dayEndTime: z.number().int().min(0).max(1440).optional(),
    }),
};

export const getCalendarsQuerySchema = {
    query: paginationSchema.extend({
        // Add specific filters if needed, e.g.
        // isDefault: z.string().transform(val => val === 'true').optional(),
    })
};

export const calendarIdSchema = {
    params: z.object({
        id: z.string().uuid(),
    }),
};

// =========================================================================
// 2. WEEKLY RULE SCHEMAS
// =========================================================================

export const createWeeklyRuleSchema = {
    params: z.object({
        calendarId: z.string().uuid(),
    }),
    body: z.object({
        dayOfWeek: z.number().int().min(0).max(6), // 0=Sunday
        type: z.nativeEnum(WeeklyRuleType),
        strategy: z.nativeEnum(RuleStrategy).default(RuleStrategy.CYCLIC),
        // For custom rules
        interval: z.number().int().min(1).optional(),
        referenceDate: z.string().datetime().or(z.date()).optional(),
        positions: z.array(z.number().int()).optional(), // e.g. [1, 3] for 1st and 3rd Saturday
    }),
};

export const updateWeeklyRuleSchema = {
    params: z.object({
        ruleId: z.string().uuid(),
    }),
    body: z.object({
        dayOfWeek: z.number().int().min(0).max(6).optional(),
        type: z.nativeEnum(WeeklyRuleType).optional(),
        strategy: z.nativeEnum(RuleStrategy).optional(),
        interval: z.number().int().min(1).optional(),
        referenceDate: z.string().datetime().or(z.date()).optional(),
        positions: z.array(z.number().int()).optional(),
    }),
};

export const weeklyRuleIdSchema = {
    params: z.object({
        ruleId: z.string().uuid(),
    }),
};

// =========================================================================
// 3. HOLIDAY SCHEMAS
// =========================================================================

export const createHolidaySchema = {
    params: z.object({
        calendarId: z.string().uuid(),
    }),
    body: z.object({
        date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)), // ISO or YYYY-MM-DD
        name: z.string().min(1, 'Holiday name is required').max(100),
        isOptional: z.boolean().default(false),
    }),
};

export const updateHolidaySchema = {
    params: z.object({
        holidayId: z.string().uuid(),
    }),
    body: z.object({
        date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
        name: z.string().min(1).max(100).optional(),
        isOptional: z.boolean().optional(),
    }),
};

export const getHolidaysQuerySchema = {
    params: z.object({
        calendarId: z.string().uuid(),
    }),
    query: z.object({
        year: z.string().regex(/^\d{4}$/).transform(Number).optional(),
        search: z.string().optional(),
    }),
};

export const holidayIdSchema = {
    params: z.object({
        holidayId: z.string().uuid(),
    }),
};

// =========================================================================
// TYPES
// =========================================================================

export type CreateCalendarInput = z.infer<typeof createCalendarSchema.body>;
export type UpdateCalendarInput = z.infer<typeof updateCalendarSchema.body>;
export type GetCalendarsQuery = z.infer<typeof getCalendarsQuerySchema.query>;

export type CreateWeeklyRuleInput = z.infer<typeof createWeeklyRuleSchema.body>;
export type UpdateWeeklyRuleInput = z.infer<typeof updateWeeklyRuleSchema.body>;

export type CreateHolidayInput = z.infer<typeof createHolidaySchema.body>;
export type UpdateHolidayInput = z.infer<typeof updateHolidaySchema.body>;
export type GetHolidaysQuery = z.infer<typeof getHolidaysQuerySchema.query>;
