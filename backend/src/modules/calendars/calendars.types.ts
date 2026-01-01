import { Calendar, CalendarWeeklyRule, CalendarHoliday, WeeklyRuleType, RuleStrategy } from '@prisma/client';

export interface PaginationParams {
    page?: number;
    limit?: number;
    search?: string;
}

export type CreateCalendarInput = Pick<Calendar, 'companyId' | 'name' | 'dayStartTime' | 'dayEndTime'>;
export type UpdateCalendarInput = Partial<Omit<CreateCalendarInput, 'companyId'>>;

export type CreateWeeklyRuleInput = Omit<CalendarWeeklyRule, 'id'>;
export type UpdateWeeklyRuleInput = Partial<Omit<CalendarWeeklyRule, 'id' | 'calendarId'>>;

export type CreateHolidayInput = Omit<CalendarHoliday, 'id'>;
export type UpdateHolidayInput = Partial<Omit<CalendarHoliday, 'id' | 'calendarId'>>;
