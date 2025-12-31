import { z } from 'zod';
import { RuleStrategy, WeeklyRuleType } from '@prisma/client';

// =========================================================================
// VALIDATION SCHEMAS & REQUEST DTOs (Inferred from Schemas)
// =========================================================================

/**
 * Create calendar schema
 */
export const createCalendarSchema = z.object({
  name: z.string().min(1, 'Calendar name is required').max(100, 'Name must not exceed 100 characters'),
  dayStartTime: z.number().int().min(0).max(1439), // 0-1439 minutes (24 hours)
  dayEndTime: z.number().int().min(0).max(1439),
}).refine((data) => data.dayStartTime < data.dayEndTime, {
  message: "Day start time must be before end time",
  path: ["dayStartTime"],
});

export type CreateCalendarRequestDto = z.infer<typeof createCalendarSchema>;

/**
 * Update calendar schema
 */
export const updateCalendarSchema = z.object({
  name: z.string().min(1, 'Calendar name is required').max(100, 'Name must not exceed 100 characters').optional(),
  dayStartTime: z.number().int().min(0).max(1439).optional(),
  dayEndTime: z.number().int().min(0).max(1439).optional(),
}).refine((data) => {
  if (data.dayStartTime !== undefined && data.dayEndTime !== undefined) {
    return data.dayStartTime < data.dayEndTime;
  }
  return true;
}, {
  message: "Day start time must be before end time",
  path: ["dayStartTime"],
});

export type UpdateCalendarRequestDto = z.infer<typeof updateCalendarSchema>;

/**
 * Create weekly rule schema
 */
export const createWeeklyRuleSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6), // 0=Sunday, 6=Saturday
  type: z.nativeEnum(WeeklyRuleType),
  strategy: z.nativeEnum(RuleStrategy),
  interval: z.number().int().min(1).optional(), // For CYCLIC strategy
  referenceDate: z.string().datetime().optional(), // For CYCLIC strategy
  positions: z.array(z.number().int()).optional(), // For POSITIONAL strategy
}).superRefine((data, ctx) => {
  if (data.strategy === 'CYCLIC') {
    if (!data.interval) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Interval is required for CYCLIC strategy",
        path: ["interval"],
      });
    }
    if (!data.referenceDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Reference date is required for CYCLIC strategy",
        path: ["referenceDate"],
      });
    }
  }
  if (data.strategy === 'POSITIONAL') {
    if (!data.positions || data.positions.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Positions array is required for POSITIONAL strategy",
        path: ["positions"],
      });
    }
  }
});

export type CreateWeeklyRuleRequestDto = z.infer<typeof createWeeklyRuleSchema>;

/**
 * Update weekly rule schema
 */
export const updateWeeklyRuleSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  type: z.nativeEnum(WeeklyRuleType).optional(),
  strategy: z.nativeEnum(RuleStrategy).optional(),
  interval: z.number().int().min(1).optional(),
  referenceDate: z.string().datetime().optional(),
  positions: z.array(z.number().int()).optional(),
});

export type UpdateWeeklyRuleRequestDto = z.infer<typeof updateWeeklyRuleSchema>;

/**
 * Create holiday schema
 */
export const createHolidaySchema = z.object({
  date: z.string().datetime(),
  name: z.string().min(1, 'Holiday name is required').max(200, 'Name must not exceed 200 characters'),
  isOptional: z.boolean().optional().default(false),
});

export type CreateHolidayRequestDto = z.infer<typeof createHolidaySchema>;

/**
 * Update holiday schema
 */
export const updateHolidaySchema = z.object({
  name: z.string().min(1, 'Holiday name is required').max(200, 'Name must not exceed 200 characters').optional(),
  isOptional: z.boolean().optional(),
});

export type UpdateHolidayRequestDto = z.infer<typeof updateHolidaySchema>;

// =========================================================================
// RESPONSE DTOs (Manual Interfaces - we trust our own backend)
// =========================================================================

/**
 * Calendar response DTO
 */
export interface CalendarResponseDto {
  id: string;
  companyId: string;
  name: string;
  dayStartTime: number;
  dayEndTime: number;
  employeeCount?: number;
  createdAt?: Date;
}

/**
 * Calendar with details response DTO
 */
export interface CalendarDetailsResponseDto {
  id: string;
  companyId: string;
  name: string;
  dayStartTime: number;
  dayEndTime: number;
  weeklyRules: WeeklyRuleResponseDto[];
  holidays: HolidayResponseDto[];
  employeeCount: number;
}

/**
 * Weekly rule response DTO
 */
export interface WeeklyRuleResponseDto {
  id: string;
  calendarId: string;
  dayOfWeek: number;
  type: WeeklyRuleType;
  strategy: RuleStrategy;
  interval?: number;
  referenceDate?: Date;
  positions?: number[];
}

/**
 * Holiday response DTO
 */
export interface HolidayResponseDto {
  id: string;
  calendarId: string;
  date: Date;
  name: string;
  isOptional: boolean;
}

/**
 * Calendars list response DTO
 */
export interface CalendarsListResponseDto {
  calendars: CalendarResponseDto[];
  total: number;
}

/**
 * Weekly rules list response DTO
 */
export interface WeeklyRulesListResponseDto {
  rules: WeeklyRuleResponseDto[];
  total: number;
}

/**
 * Holidays list response DTO
 */
export interface HolidaysListResponseDto {
  holidays: HolidayResponseDto[];
  total: number;
}