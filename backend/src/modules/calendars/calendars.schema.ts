import { z } from 'zod';
import { WeeklyRuleType, RuleStrategy } from '@prisma/client';

export const createCalendarSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Name is required'),
        dayStartTime: z.number().min(0).max(1440),
        dayEndTime: z.number().min(0).max(1440),
    }),
});

export const updateCalendarSchema = z.object({
    params: z.object({
        calendarId: z.string().uuid().optional(),
        id: z.string().uuid().optional()
    }),
    body: z.object({
        name: z.string().optional(),
        dayStartTime: z.number().min(0).max(1440).optional(),
        dayEndTime: z.number().min(0).max(1440).optional(),
    }),
});

export const calendarQuerySchema = z.object({
    query: z.object({
        companyId: z.string().uuid().optional(),
        page: z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: z.string().regex(/^\d+$/).transform(Number).optional(),
        search: z.string().optional(),
    }),
});

// Weekly Rules
export const createWeeklyRuleSchema = z.object({
    body: z.object({
        dayOfWeek: z.number().min(0).max(6),
        type: z.nativeEnum(WeeklyRuleType),
        strategy: z.nativeEnum(RuleStrategy),
        interval: z.number().optional(),
        referenceDate: z.string().datetime().optional(),
        positions: z.array(z.number()).optional(),
    }),
});

export const updateWeeklyRuleSchema = z.object({
    body: z.object({
        dayOfWeek: z.number().min(0).max(6).optional(),
        type: z.nativeEnum(WeeklyRuleType).optional(),
        strategy: z.nativeEnum(RuleStrategy).optional(),
        interval: z.number().optional(),
        referenceDate: z.string().datetime().optional(),
        positions: z.array(z.number()).optional(),
    }),
});

// Holidays
export const createHolidaySchema = z.object({
    body: z.object({
        date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
        name: z.string().min(1),
        isOptional: z.boolean().optional(),
    }),
});

export const updateHolidaySchema = z.object({
    body: z.object({
        date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
        name: z.string().optional(),
        isOptional: z.boolean().optional(),
    }),
});

export const holidayQuerySchema = z.object({
    query: z.object({
        year: z.string().regex(/^\d{4}$/).optional(),
        search: z.string().optional(),
    }),
});
