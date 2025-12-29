import { z } from 'zod';
import { RuleStrategy, WeeklyRuleType } from '@prisma/client';

export const listCalendarsSchema = z.object({
    // No params needed
});

export const createCalendarSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Calendar name is required').max(100, 'Name too long'),
        dayStartTime: z.number().int().min(0).max(1439, 'Start time must be between 0-1439 minutes'),
        dayEndTime: z.number().int().min(0).max(1439, 'End time must be between 0-1439 minutes'),
    }).refine((data) => data.dayEndTime > data.dayStartTime, {
        message: 'End time must be after start time',
        path: ['dayEndTime'],
    }),
});

export const updateCalendarSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid calendar ID'),
    }),
    body: z.object({
        name: z.string().min(1).max(100).optional(),
        dayStartTime: z.number().int().min(0).max(1439).optional(),
        dayEndTime: z.number().int().min(0).max(1439).optional(),
    }).refine((data) => {
        if (data.dayStartTime !== undefined && data.dayEndTime !== undefined) {
            return data.dayEndTime > data.dayStartTime;
        }
        return true;
    }, {
        message: 'End time must be after start time',
        path: ['dayEndTime'],
    }),
});

export const setWeeklyRulesSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid calendar ID'),
    }),
    body: z.object({
        rules: z.array(z.object({
            dayOfWeek: z.number().int().min(0).max(6, 'Day of week must be 0-6'),
            type: z.nativeEnum(WeeklyRuleType, { message: 'Invalid rule type' }),
            strategy: z.nativeEnum(RuleStrategy, { message: 'Invalid strategy' }),
            interval: z.number().int().min(1).optional(),
            referenceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
            positions: z.array(z.number().int()).optional(),
        }).refine((data) => {
            // CYCLIC strategy requires interval
            if (data.strategy === RuleStrategy.CYCLIC) {
                return data.interval !== undefined;
            }
            // POSITIONAL strategy requires positions
            if (data.strategy === RuleStrategy.POSITIONAL) {
                return data.positions !== undefined && data.positions.length > 0;
            }
            return true;
        }, {
            message: 'CYCLIC requires interval, POSITIONAL requires positions',
        })),
    }),
});

export const getHolidaysSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid calendar ID'),
    }),
});

export const createHolidaySchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid calendar ID'),
    }),
    body: z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
        name: z.string().min(1, 'Holiday name is required').max(100),
        isOptional: z.boolean().optional().default(false),
    }),
});

export const bulkCreateHolidaysSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid calendar ID'),
    }),
    body: z.object({
        holidays: z.array(z.object({
            date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            name: z.string().min(1).max(100),
            isOptional: z.boolean().optional().default(false),
        })).min(1, 'At least one holiday is required'),
    }),
});

export const deleteHolidaySchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid calendar ID'),
        hid: z.string().uuid('Invalid holiday ID'),
    }),
});

export const checkDateSchema = z.object({
    query: z.object({
        calendarId: z.string().uuid('Invalid calendar ID'),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    }),
});
