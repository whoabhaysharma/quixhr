import { RuleStrategy, WeeklyRuleType } from '@prisma/client';

export interface CreateCalendarDTO {
    name: string;
    dayStartTime: number; // Minutes from midnight
    dayEndTime: number;   // Minutes from midnight
}

export interface UpdateCalendarDTO {
    name?: string;
    dayStartTime?: number;
    dayEndTime?: number;
}

export interface WeeklyRuleDTO {
    dayOfWeek: number; // 0-6 (Sunday-Saturday)
    type: WeeklyRuleType;
    strategy: RuleStrategy;
    // For CYCLIC strategy
    interval?: number;
    referenceDate?: string; // ISO date string
    // For POSITIONAL strategy
    positions?: number[]; // e.g., [1, 3] for 1st and 3rd, [-1] for last
}

export interface SetWeeklyRulesDTO {
    rules: WeeklyRuleDTO[];
}

export interface CreateHolidayDTO {
    date: string; // YYYY-MM-DD
    name: string;
    isOptional?: boolean;
}

export interface BulkCreateHolidaysDTO {
    holidays: CreateHolidayDTO[];
}

export interface CheckDateDTO {
    calendarId: string;
    date: string; // YYYY-MM-DD
}

export interface CheckDateResponse {
    date: string;
    isWorking: boolean;
    isHoliday: boolean;
    isWeeklyOff: boolean;
    isHalfDay: boolean;
    holidayName?: string;
    dayType: 'WORKING' | 'OFF' | 'HALF_DAY' | 'HOLIDAY';
}
