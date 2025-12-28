import { PrismaClient } from '@prisma/client';
import { CreateCalendarDto, UpdateCalendarDto, CalendarResponseDto } from './calendar.types';
import * as rulesService from './rules/rules.service';
import * as holidaysService from './holidays/holidays.service';
import { timeToMinutes, minutesToTime } from '../../utils/time.utils';
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
        // Convert Int (minutes) back to String (HH:MM) for API
        dayStartTime: minutesToTime(calendar.dayStartTime),
        dayEndTime: minutesToTime(calendar.dayEndTime),
        weeklyRules: calendar.weeklyRules?.map((r: any) => ({
            dayOfWeek: r.dayOfWeek,
            rule: r.rule,
            weekNumbers: r.weekNumbers || []
        })) || [],
        holidays: calendar.holidays?.map((h: any) => ({
            startDate: h.startDate,
            endDate: h.endDate,
            name: h.name
        })) || [],
        leavePolicies: calendar.leavePolicies?.map((lp: any) => ({
            leaveType: lp.leaveType,
            annualAllowance: lp.annualAllowance,
            canCarryForward: lp.canCarryForward,
            maxCarryOver: lp.maxCarryOver
        })) || [],
        // Direct employee relation (no more EmployeeCalendar pivot)
        assignedEmployees: calendar.employees?.map((emp: any) => ({
            id: emp.id,
            name: emp.name,
            role: emp.user?.role || 'EMPLOYEE',
            email: emp.user?.email || '',
            leaveBalances: emp.leaveBalances?.map((lb: any) => ({
                type: lb.type,
                allocated: lb.allocated,
                used: lb.used
            })) || []
        })) || [],
        createdAt: calendar.createdAt
    };
};

/**
 * Create a new calendar with rules and holidays
 */
export async function createCalendar(dto: CreateCalendarDto): Promise<CalendarResponseDto> {
    const calendar = await prisma.$transaction(async (tx) => {
        // Create base calendar - convert time strings to integers
        const cal = await tx.calendar.create({
            data: {
                companyId: dto.companyId,
                name: dto.name,
                dayStartTime: timeToMinutes(dto.dayStartTime),
                dayEndTime: timeToMinutes(dto.dayEndTime),
            }
        });

        // Add weekly rules
        if (dto.weeklyRules && dto.weeklyRules.length > 0) {
            await tx.calendarWeeklyRule.createMany({
                data: dto.weeklyRules.map(r => ({
                    calendarId: cal.id,
                    dayOfWeek: r.dayOfWeek,
                    rule: r.rule,
                    weekNumbers: r.weekNumbers || []
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
            holidays: { orderBy: { startDate: 'asc' } },
            leavePolicies: true,
            // Direct employee relation
            employees: {
                include: {
                    user: true,
                    leaveBalances: true
                }
            }
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
            holidays: { orderBy: { startDate: 'asc' } },
            leavePolicies: true,
            // Direct employee relation
            employees: {
                include: {
                    user: true,
                    leaveBalances: true
                }
            }
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
        // Update basic fields - convert time strings to integers
        if (dto.name || dto.dayStartTime || dto.dayEndTime) {
            await tx.calendar.update({
                where: { id },
                data: {
                    name: dto.name,
                    dayStartTime: dto.dayStartTime ? timeToMinutes(dto.dayStartTime) : undefined,
                    dayEndTime: dto.dayEndTime ? timeToMinutes(dto.dayEndTime) : undefined,
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
                        rule: r.rule,
                        weekNumbers: r.weekNumbers || []
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
    // Check if any employees are using this calendar (direct relation)
    const usageCount = await prisma.employee.count({
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
        prisma.leavePolicy.deleteMany({ where: { calendarId: id } }),
        prisma.calendar.delete({ where: { id } })
    ]);
}

/**
 * Get upcoming holidays for an employee
 */
export async function getUpcomingHolidays(employeeId: string, limit: number = 3): Promise<any[]> {
    // Find employee with calendar assignment (direct relation)
    const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        select: { calendarId: true }
    });

    if (!employee || !employee.calendarId) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const holidays = await prisma.calendarHoliday.findMany({
        where: {
            calendarId: employee.calendarId,
            startDate: { gte: today }
        },
        orderBy: { startDate: 'asc' },
        take: limit
    });

    return holidays.map(h => ({
        id: h.id,
        name: h.name,
        date: h.startDate,
        endDate: h.endDate,
        calendarId: h.calendarId,
    }));
}
