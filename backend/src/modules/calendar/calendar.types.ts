import { z } from 'zod';
import { WeeklyRuleType, DayType } from '@prisma/client';
import { WeeklyRuleDto } from './rules/rules.types';
import { HolidayDto } from './holidays/holidays.types';

// ============================================================================
// RE-EXPORTS
// ============================================================================
export { WeeklyRuleDto, HolidayDto, DayType };

export interface DayResolution {
    dayType: DayType;
    isWorkingDay: boolean;
}

// ============================================================================
// SCHEMAS
// ============================================================================

export const weeklyRuleSchema = z.object({
    dayOfWeek: z.number().min(0).max(6),
    rule: z.nativeEnum(WeeklyRuleType),
});

export const holidaySchema = z.object({
    startDate: z.string().transform((str) => new Date(str)).or(z.date()),
    endDate: z.string().transform((str) => new Date(str)).or(z.date()),
    name: z.string().min(1),
});

export const createCalendarSchema = z.object({
    companyId: z.string().uuid(), // Required - injected by controller from auth user
    name: z.string().min(1),
    year: z.number().int().min(2020),
    dayStartTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format HH:MM'),
    midDayCutoff: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format HH:MM'),
    dayEndTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format HH:MM'),
    weeklyRules: z.array(weeklyRuleSchema).optional(),
    holidays: z.array(holidaySchema).optional(),
});

export const updateCalendarSchema = z.object({
    name: z.string().optional(),
    dayStartTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format HH:MM').optional(),
    midDayCutoff: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format HH:MM').optional(),
    dayEndTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format HH:MM').optional(),
    weeklyRules: z.array(weeklyRuleSchema).optional(),
    holidays: z.array(holidaySchema).optional(),
});

// ============================================================================
// TYPES
// ============================================================================

export type CreateCalendarDto = z.infer<typeof createCalendarSchema>;
export type UpdateCalendarDto = z.infer<typeof updateCalendarSchema>;

export interface CalendarResponseDto {
    id: string;
    companyId: string;
    name: string;
    year: number;
    dayStartTime: string;
    midDayCutoff: string;
    dayEndTime: string;
    weeklyRules: WeeklyRuleDto[];
    holidays: HolidayDto[];
    createdAt: Date;
}
