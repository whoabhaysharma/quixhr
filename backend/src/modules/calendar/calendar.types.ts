import { z } from 'zod';
import { WeeklyRuleType, LeaveType } from '@prisma/client';
import { WeeklyRuleDto } from './rules/rules.types';
import { HolidayDto } from './holidays/holidays.types';

// ============================================================================
// RE-EXPORTS
// ============================================================================
export { WeeklyRuleDto, HolidayDto };

export interface DayResolution {
    dayType: 'WORKING' | 'WEEKLY_OFF' | 'HOLIDAY';
    isWorkingDay: boolean;
    isHoliday?: boolean;
}

// ============================================================================
// SCHEMAS
// ============================================================================

export const weeklyRuleSchema = z.object({
    dayOfWeek: z.number().min(0).max(6),
    rule: z.nativeEnum(WeeklyRuleType),
    weekNumbers: z.array(z.number().int().min(1).max(5)).optional(), // Week numbers for alternate schedules
});

export const holidaySchema = z.object({
    startDate: z.string().transform((str) => new Date(str)).or(z.date()),
    endDate: z.string().transform((str) => new Date(str)).or(z.date()),
    name: z.string().min(1),
});

// Accept time as string "HH:MM" in API, will convert to Int internally
export const createCalendarSchema = z.object({
    companyId: z.string().uuid(), // Required - injected by controller from auth user
    name: z.string().min(1),
    dayStartTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format HH:MM'),
    dayEndTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format HH:MM'),
    weeklyRules: z.array(weeklyRuleSchema).optional(),
    holidays: z.array(holidaySchema).optional(),
});

export const updateCalendarSchema = z.object({
    name: z.string().optional(),
    dayStartTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format HH:MM').optional(),
    dayEndTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format HH:MM').optional(),
    weeklyRules: z.array(weeklyRuleSchema).optional(),
    holidays: z.array(holidaySchema).optional(),
});

// Leave Policy schemas
export const leavePolicySchema = z.object({
    leaveType: z.nativeEnum(LeaveType),
    annualAllowance: z.number().min(0),
    canCarryForward: z.boolean().optional(),
    maxCarryOver: z.number().min(0).optional(),
});

export const createLeavePolicySchema = z.object({
    calendarId: z.string().uuid(),
    policies: z.array(leavePolicySchema),
});

// ============================================================================
// TYPES
// ============================================================================

export type CreateCalendarDto = z.infer<typeof createCalendarSchema>;
export type UpdateCalendarDto = z.infer<typeof updateCalendarSchema>;
export type LeavePolicyDto = z.infer<typeof leavePolicySchema>;

export interface CalendarResponseDto {
    id: string;
    companyId: string;
    name: string;
    dayStartTime: string; // Returned as "HH:MM" for API
    dayEndTime: string;   // Returned as "HH:MM" for API
    weeklyRules: WeeklyRuleDto[];
    holidays: HolidayDto[];
    leavePolicies?: LeavePolicyDto[];
    assignedEmployees?: {
        id: string;
        name: string;
        role: string;
        email: string;
        leaveBalances?: {
            type: LeaveType;
            allocated: number;
            used: number;
        }[];
    }[];
    createdAt: Date;
}
