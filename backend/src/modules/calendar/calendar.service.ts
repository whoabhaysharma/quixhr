import prisma from '@/utils/prisma';
import { AppError } from '@/utils/appError';
import {
    CreateCalendarDTO,
    UpdateCalendarDTO,
    SetWeeklyRulesDTO,
    CreateHolidayDTO,
    BulkCreateHolidaysDTO,
    CheckDateDTO,
    CheckDateResponse,
} from './calendar.types';
import { RuleStrategy, WeeklyRuleType } from '@prisma/client';
import { parseISO, getDay, startOfDay, getWeekOfMonth, isLastDayOfMonth, addDays } from 'date-fns';

/**
 * List all calendars for a company
 */
export const listCalendars = async (companyId: string) => {
    const calendars = await prisma.calendar.findMany({
        where: { companyId },
        include: {
            weeklyRules: true,
            holidays: {
                orderBy: { date: 'asc' },
            },
            _count: {
                select: {
                    employees: true,
                },
            },
        },
        orderBy: { name: 'asc' },
    });

    return calendars;
};

/**
 * Get a single calendar by ID
 */
export const getCalendarById = async (calendarId: string, companyId: string) => {
    const calendar = await prisma.calendar.findFirst({
        where: {
            id: calendarId,
            companyId,
        },
        include: {
            weeklyRules: true,
            holidays: {
                orderBy: { date: 'asc' },
            },
            _count: {
                select: {
                    employees: true,
                },
            },
        },
    });

    if (!calendar) {
        throw new AppError('Calendar not found', 404);
    }

    return calendar;
};

/**
 * Create a new calendar
 */
export const createCalendar = async (companyId: string, data: CreateCalendarDTO) => {
    const calendar = await prisma.calendar.create({
        data: {
            companyId,
            name: data.name,
            dayStartTime: data.dayStartTime,
            dayEndTime: data.dayEndTime,
        },
        include: {
            weeklyRules: true,
            holidays: true,
        },
    });

    return calendar;
};

/**
 * Update calendar timings
 */
export const updateCalendar = async (
    calendarId: string,
    companyId: string,
    data: UpdateCalendarDTO
) => {
    // Verify calendar belongs to company
    const existing = await prisma.calendar.findFirst({
        where: {
            id: calendarId,
            companyId,
        },
    });

    if (!existing) {
        throw new AppError('Calendar not found', 404);
    }

    const calendar = await prisma.calendar.update({
        where: { id: calendarId },
        data: {
            name: data.name,
            dayStartTime: data.dayStartTime,
            dayEndTime: data.dayEndTime,
        },
        include: {
            weeklyRules: true,
            holidays: true,
        },
    });

    return calendar;
};

/**
 * Set weekly rules for a calendar (replaces all existing rules)
 */
export const setWeeklyRules = async (
    calendarId: string,
    companyId: string,
    data: SetWeeklyRulesDTO
) => {
    // Verify calendar belongs to company
    const calendar = await prisma.calendar.findFirst({
        where: {
            id: calendarId,
            companyId,
        },
    });

    if (!calendar) {
        throw new AppError('Calendar not found', 404);
    }

    // Delete existing rules and create new ones in a transaction
    await prisma.$transaction(async (tx) => {
        // Delete all existing rules
        await tx.calendarWeeklyRule.deleteMany({
            where: { calendarId },
        });

        // Create new rules
        if (data.rules.length > 0) {
            await tx.calendarWeeklyRule.createMany({
                data: data.rules.map((rule) => ({
                    calendarId,
                    dayOfWeek: rule.dayOfWeek,
                    type: rule.type,
                    strategy: rule.strategy,
                    interval: rule.interval,
                    referenceDate: rule.referenceDate ? parseISO(rule.referenceDate) : null,
                    positions: rule.positions || [],
                })),
            });
        }
    });

    // Fetch and return updated calendar
    const updated = await prisma.calendar.findUnique({
        where: { id: calendarId },
        include: {
            weeklyRules: true,
            holidays: true,
        },
    });

    return updated;
};

/**
 * Get holidays for a calendar
 */
export const getHolidays = async (calendarId: string, companyId: string) => {
    // Verify calendar belongs to company
    const calendar = await prisma.calendar.findFirst({
        where: {
            id: calendarId,
            companyId,
        },
    });

    if (!calendar) {
        throw new AppError('Calendar not found', 404);
    }

    const holidays = await prisma.calendarHoliday.findMany({
        where: { calendarId },
        orderBy: { date: 'asc' },
    });

    return holidays;
};

/**
 * Create a single holiday
 */
export const createHoliday = async (
    calendarId: string,
    companyId: string,
    data: CreateHolidayDTO
) => {
    // Verify calendar belongs to company
    const calendar = await prisma.calendar.findFirst({
        where: {
            id: calendarId,
            companyId,
        },
    });

    if (!calendar) {
        throw new AppError('Calendar not found', 404);
    }

    const date = parseISO(data.date);

    // Check if holiday already exists for this date
    const existing = await prisma.calendarHoliday.findFirst({
        where: {
            calendarId,
            date: startOfDay(date),
        },
    });

    if (existing) {
        throw new AppError('A holiday already exists for this date', 400);
    }

    const holiday = await prisma.calendarHoliday.create({
        data: {
            calendarId,
            date: startOfDay(date),
            name: data.name,
            isOptional: data.isOptional || false,
        },
    });

    return holiday;
};

/**
 * Bulk create holidays
 */
export const bulkCreateHolidays = async (
    calendarId: string,
    companyId: string,
    data: BulkCreateHolidaysDTO
) => {
    // Verify calendar belongs to company
    const calendar = await prisma.calendar.findFirst({
        where: {
            id: calendarId,
            companyId,
        },
    });

    if (!calendar) {
        throw new AppError('Calendar not found', 404);
    }

    const results = {
        success: [] as any[],
        failed: [] as any[],
    };

    for (const holidayData of data.holidays) {
        try {
            const date = parseISO(holidayData.date);

            // Check if holiday already exists
            const existing = await prisma.calendarHoliday.findFirst({
                where: {
                    calendarId,
                    date: startOfDay(date),
                },
            });

            if (existing) {
                results.failed.push({
                    date: holidayData.date,
                    name: holidayData.name,
                    reason: 'Holiday already exists for this date',
                });
                continue;
            }

            const holiday = await prisma.calendarHoliday.create({
                data: {
                    calendarId,
                    date: startOfDay(date),
                    name: holidayData.name,
                    isOptional: holidayData.isOptional || false,
                },
            });

            results.success.push(holiday);
        } catch (error: any) {
            results.failed.push({
                date: holidayData.date,
                name: holidayData.name,
                reason: error.message || 'Unknown error',
            });
        }
    }

    return results;
};

/**
 * Delete a holiday
 */
export const deleteHoliday = async (
    calendarId: string,
    holidayId: string,
    companyId: string
) => {
    // Verify calendar belongs to company
    const calendar = await prisma.calendar.findFirst({
        where: {
            id: calendarId,
            companyId,
        },
    });

    if (!calendar) {
        throw new AppError('Calendar not found', 404);
    }

    // Verify holiday belongs to this calendar
    const holiday = await prisma.calendarHoliday.findFirst({
        where: {
            id: holidayId,
            calendarId,
        },
    });

    if (!holiday) {
        throw new AppError('Holiday not found', 404);
    }

    await prisma.calendarHoliday.delete({
        where: { id: holidayId },
    });

    return { message: 'Holiday deleted successfully' };
};

/**
 * Helper function to get the week number of a date in its month
 */
function getWeekNumberInMonth(date: Date): number {
    return getWeekOfMonth(date, { weekStartsOn: 0 }); // Sunday = 0
}

/**
 * Helper function to check if date is the last occurrence of a weekday in the month
 */
function isLastOccurrenceInMonth(date: Date): boolean {
    const dayOfWeek = getDay(date);
    const nextWeek = addDays(date, 7);
    return nextWeek.getMonth() !== date.getMonth();
}

/**
 * Check if a specific date is working/off/holiday
 */
export const checkDate = async (data: CheckDateDTO): Promise<CheckDateResponse> => {
    const calendar = await prisma.calendar.findUnique({
        where: { id: data.calendarId },
        include: {
            weeklyRules: true,
            holidays: true,
        },
    });

    if (!calendar) {
        throw new AppError('Calendar not found', 404);
    }

    const date = startOfDay(parseISO(data.date));
    const dayOfWeek = getDay(date); // 0 = Sunday, 6 = Saturday

    // Check if it's a holiday
    const holiday = calendar.holidays.find(
        (h) => startOfDay(h.date).getTime() === date.getTime()
    );

    if (holiday) {
        return {
            date: data.date,
            isWorking: false,
            isHoliday: true,
            isWeeklyOff: false,
            isHalfDay: false,
            holidayName: holiday.name,
            dayType: 'HOLIDAY',
        };
    }

    // Check weekly rules for this day of week
    const rulesForDay = calendar.weeklyRules.filter((rule) => rule.dayOfWeek === dayOfWeek);

    if (rulesForDay.length === 0) {
        // No rules defined for this day - assume working day
        return {
            date: data.date,
            isWorking: true,
            isHoliday: false,
            isWeeklyOff: false,
            isHalfDay: false,
            dayType: 'WORKING',
        };
    }

    // Evaluate rules
    for (const rule of rulesForDay) {
        let ruleApplies = false;

        if (rule.strategy === RuleStrategy.CYCLIC) {
            // Cyclic strategy: Every X weeks
            if (rule.referenceDate) {
                const refDate = startOfDay(rule.referenceDate);
                const daysDiff = Math.floor((date.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24));
                const weeksDiff = Math.floor(daysDiff / 7);
                ruleApplies = weeksDiff % (rule.interval || 1) === 0;
            } else {
                // No reference date - apply every interval weeks from epoch
                const weekNumber = Math.floor(date.getTime() / (1000 * 60 * 60 * 24 * 7));
                ruleApplies = weekNumber % (rule.interval || 1) === 0;
            }
        } else if (rule.strategy === RuleStrategy.POSITIONAL) {
            // Positional strategy: Specific occurrences (1st, 2nd, 3rd, 4th, Last)
            const weekInMonth = getWeekNumberInMonth(date);
            const isLast = isLastOccurrenceInMonth(date);

            ruleApplies = rule.positions.some((pos) => {
                if (pos === -1) {
                    return isLast;
                }
                return pos === weekInMonth;
            });
        }

        if (ruleApplies) {
            // Rule applies - return the type
            if (rule.type === WeeklyRuleType.OFF) {
                return {
                    date: data.date,
                    isWorking: false,
                    isHoliday: false,
                    isWeeklyOff: true,
                    isHalfDay: false,
                    dayType: 'OFF',
                };
            } else if (rule.type === WeeklyRuleType.HALF_DAY) {
                return {
                    date: data.date,
                    isWorking: true,
                    isHoliday: false,
                    isWeeklyOff: false,
                    isHalfDay: true,
                    dayType: 'HALF_DAY',
                };
            } else {
                return {
                    date: data.date,
                    isWorking: true,
                    isHoliday: false,
                    isWeeklyOff: false,
                    isHalfDay: false,
                    dayType: 'WORKING',
                };
            }
        }
    }

    // No matching rule - default to working day
    return {
        date: data.date,
        isWorking: true,
        isHoliday: false,
        isWeeklyOff: false,
        isHalfDay: false,
        dayType: 'WORKING',
    };
};
