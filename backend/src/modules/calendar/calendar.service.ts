import { PrismaClient, WeeklyRuleType } from '@prisma/client';
import { CreateCalendarDto, UpdateCalendarDto, CalendarResponseDto } from './calendar.types';
import * as rulesService from './rules/rules.service';
import * as holidaysService from './holidays/holidays.service';
export { resolveDay } from './resolver/resolver.service';

const prisma = new PrismaClient();

/**
 * Format helper
 */
const formatCalendar = (calendar: any): CalendarResponseDto => {
    return {
        id: calendar.id,
        companyId: calendar.companyId,
        name: calendar.name,
        year: calendar.year,
        dayStartTime: calendar.dayStartTime,
        midDayCutoff: calendar.midDayCutoff,
        dayEndTime: calendar.dayEndTime,
        weeklyRules: calendar.weeklyRules?.map((r: any) => ({ dayOfWeek: r.dayOfWeek, rule: r.rule })) || [],
        holidays: calendar.holidays?.map((h: any) => ({ startDate: h.startDate, endDate: h.endDate, name: h.name })) || [],
        createdAt: calendar.createdAt
    };
};

/**
 * Create a new calendar with rules and holidays
 */
export async function createCalendar(dto: CreateCalendarDto): Promise<CalendarResponseDto> {
    const calendar = await prisma.$transaction(async (tx) => {
        // Create base calendar
        const cal = await tx.calendar.create({
            data: {
                companyId: dto.companyId,
                name: dto.name,
                year: dto.year,
                dayStartTime: dto.dayStartTime,
                midDayCutoff: dto.midDayCutoff,
                dayEndTime: dto.dayEndTime,
            }
        });

        // Add weekly rules
        // Add weekly rules
        if (dto.weeklyRules && dto.weeklyRules.length > 0) {
            await tx.calendarWeeklyRule.createMany({
                data: dto.weeklyRules.map(r => ({
                    calendarId: cal.id,
                    dayOfWeek: r.dayOfWeek,
                    rule: r.rule
                }))
            });
        } else {
            // Default rules
            await tx.calendarWeeklyRule.createMany({
                data: rulesService.generateDefaultRules(cal.id)
            });
        }

        // Add holidays
        if (dto.holidays && dto.holidays.length > 0) {
            await tx.calendarHoliday.createMany({
                data: dto.holidays.map(h => holidaysService.formatHolidayForCreation(cal.id, h))
            });
        }

        return cal;
    });

    return getCalendarById(calendar.id) as Promise<CalendarResponseDto>;
}

/**
 * Get all calendars for a company
 */
export async function getAllCalendars(companyId: string): Promise<CalendarResponseDto[]> {
    const calendars = await prisma.calendar.findMany({
        where: { companyId },
        include: {
            weeklyRules: { orderBy: { dayOfWeek: 'asc' } },
            holidays: { orderBy: { startDate: 'asc' } }
        },
        orderBy: { createdAt: 'desc' }
    });

    return calendars.map(formatCalendar);
}

/**
 * Get calendar by ID
 */
export async function getCalendarById(id: string): Promise<CalendarResponseDto | null> {
    const calendar = await prisma.calendar.findUnique({
        where: { id },
        include: {
            weeklyRules: { orderBy: { dayOfWeek: 'asc' } },
            holidays: { orderBy: { startDate: 'asc' } }
        }
    });

    if (!calendar) return null;
    return formatCalendar(calendar);
}

/**
 * Update calendar
 */
export async function updateCalendar(id: string, dto: UpdateCalendarDto): Promise<CalendarResponseDto> {
    await prisma.$transaction(async (tx) => {
        // Update basic fields
        if (dto.name || dto.dayStartTime || dto.midDayCutoff || dto.dayEndTime) {
            await tx.calendar.update({
                where: { id },
                data: {
                    name: dto.name,
                    dayStartTime: dto.dayStartTime,
                    midDayCutoff: dto.midDayCutoff,
                    dayEndTime: dto.dayEndTime,
                }
            });
        }

        // Replace weekly rules if provided
        if (dto.weeklyRules) {
            await tx.calendarWeeklyRule.deleteMany({ where: { calendarId: id } });
            if (dto.weeklyRules.length > 0) {
                await tx.calendarWeeklyRule.createMany({
                    data: dto.weeklyRules.map(r => ({
                        calendarId: id,
                        dayOfWeek: r.dayOfWeek,
                        rule: r.rule
                    }))
                });
            }
        }

        // Replace holidays if provided
        if (dto.holidays) {
            await tx.calendarHoliday.deleteMany({ where: { calendarId: id } });
            if (dto.holidays.length > 0) {
                await tx.calendarHoliday.createMany({
                    data: dto.holidays.map(h => holidaysService.formatHolidayForCreation(id, h))
                });
            }
        }
    });

    return getCalendarById(id) as Promise<CalendarResponseDto>;
}

/**
 * Delete calendar
 */
export async function deleteCalendar(id: string): Promise<void> {
    // Check if any employees are using this calendar
    const usageCount = await prisma.employeeCalendar.count({
        where: { calendarId: id }
    });

    if (usageCount > 0) {
        throw new Error(`Cannot delete calendar. It is assigned to ${usageCount} employees.`);
    }

    // Cascade delete is handled by Prisma relation/DB constraints mostly, 
    // but explicit delete is safer to ensure order
    await prisma.$transaction([
        prisma.calendarWeeklyRule.deleteMany({ where: { calendarId: id } }),
        prisma.calendarHoliday.deleteMany({ where: { calendarId: id } }),
        prisma.calendar.delete({ where: { id } })
    ]);
}
