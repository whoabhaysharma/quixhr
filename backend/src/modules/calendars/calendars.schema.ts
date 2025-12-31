import { z } from 'zod';
import { RuleStrategy, WeeklyRuleType } from '@prisma/client';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Create calendar schema
 */
export const createCalendarSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Calendar name is required').max(100, 'Name must not exceed 100 characters'),
    dayStartTime: z.number().int().min(0).max(1439), // 0-1439 minutes (24 hours)
    dayEndTime: z.number().int().min(0).max(1439),
  }).refine((data) => data.dayStartTime < data.dayEndTime, {
    message: "Day start time must be before end time",
    path: ["dayStartTime"],
  }),
});

/**
 * Update calendar schema
 */
export const updateCalendarSchema = z.object({
  body: z.object({
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
  }),
  params: z.object({
    calendarId: z.string().uuid(),
  }),
});

/**
 * Create weekly rule schema
 */
export const createWeeklyRuleSchema = z.object({
  body: z.object({
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
  }),
  params: z.object({
    calendarId: z.string().uuid(),
  }),
});

/**
 * Update weekly rule schema
 */
export const updateWeeklyRuleSchema = z.object({
  body: z.object({
    dayOfWeek: z.number().int().min(0).max(6).optional(),
    type: z.nativeEnum(WeeklyRuleType).optional(),
    strategy: z.nativeEnum(RuleStrategy).optional(),
    interval: z.number().int().min(1).optional(),
    referenceDate: z.string().datetime().optional(),
    positions: z.array(z.number().int()).optional(),
  }),
  params: z.object({
    calendarId: z.string().uuid(),
    ruleId: z.string().uuid(),
  }),
});

/**
 * Create holiday schema
 */
export const createHolidaySchema = z.object({
  body: z.object({
    date: z.string().datetime(),
    name: z.string().min(1, 'Holiday name is required').max(200, 'Name must not exceed 200 characters'),
    isOptional: z.boolean().optional().default(false),
  }),
  params: z.object({
    calendarId: z.string().uuid(),
  }),
});

/**
 * Update holiday schema
 */
export const updateHolidaySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Holiday name is required').max(200, 'Name must not exceed 200 characters').optional(),
    isOptional: z.boolean().optional(),
  }),
  params: z.object({
    calendarId: z.string().uuid(),
    holidayId: z.string().uuid(),
  }),
});

/**
 * Calendar query schema
 */
export const calendarQuerySchema = z.object({
  query: z.object({
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('20'),
    name: z.string().optional(),
  }),
});

/**
 * Holiday query schema
 */
export const holidayQuerySchema = z.object({
  query: z.object({
    year: z.string().transform(Number).optional(),
  }),
  params: z.object({
    calendarId: z.string().uuid(),
  }),
});

// ============================================================================
// TYPE EXPORTS (Request DTOs)
// ============================================================================

export type CreateCalendarRequestDto = z.infer<typeof createCalendarSchema>['body'];
export type UpdateCalendarRequestDto = z.infer<typeof updateCalendarSchema>['body'];
export type CreateWeeklyRuleRequestDto = z.infer<typeof createWeeklyRuleSchema>['body'];
export type UpdateWeeklyRuleRequestDto = z.infer<typeof updateWeeklyRuleSchema>['body'];
export type CreateHolidayRequestDto = z.infer<typeof createHolidaySchema>['body'];
export type UpdateHolidayRequestDto = z.infer<typeof updateHolidaySchema>['body'];
export type CalendarQueryDto = z.infer<typeof calendarQuerySchema>['query'];
export type HolidayQueryDto = z.infer<typeof holidayQuerySchema>['query'];

// ============================================================================
// RESPONSE DTOs
// ============================================================================

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