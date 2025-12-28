import { PrismaClient } from '@prisma/client';
import { HolidayDto } from './holidays.types';

const prisma = new PrismaClient();

// In the future, specific holiday CRUD can be added here.
// For now, we are primarily using bulk operations in calendar.service.ts,
// but we can expose helpers if needed.

/**
 * Add a holiday to a calendar
 */
export async function addHoliday(calendarId: string, dto: HolidayDto) {
    const holiday = await prisma.calendarHoliday.create({
        data: {
            calendarId,
            name: dto.name,
            startDate: new Date(dto.startDate),
            endDate: new Date(dto.endDate),
        },
        include: {
            calendar: {
                include: {
                    company: {
                        include: {
                            employees: {
                                select: {
                                    userId: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    // Notify all employees in the company about the new holiday
    const userIds = holiday.calendar.company.employees
        .map(emp => emp.userId)
        .filter((id): id is string => id !== null);
    if (userIds.length > 0) {
        const { notifyCalendar } = await import('../../notification/notification.helper');
        await notifyCalendar.holidayAdded(userIds, dto.name, new Date(dto.startDate));
    }

    return holiday;
}

/**
 * Get all holidays for a calendar
 */
export async function getHolidays(calendarId: string) {
    return prisma.calendarHoliday.findMany({
        where: { calendarId },
        orderBy: { startDate: 'asc' }
    });
}

/**
 * Delete a holiday
 */
export async function deleteHoliday(calendarId: string, holidayId: string) {
    // Get holiday details before deletion for notification
    const holiday = await prisma.calendarHoliday.findFirst({
        where: {
            id: holidayId,
            calendarId,
        },
        include: {
            calendar: {
                include: {
                    company: {
                        include: {
                            employees: {
                                select: {
                                    userId: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!holiday) {
        throw new Error('Holiday not found or does not belong to this calendar');
    }

    // Delete the holiday
    await prisma.calendarHoliday.delete({
        where: { id: holidayId },
    });

    // Notify all employees in the company about the deleted holiday
    const userIds = holiday.calendar.company.employees
        .map(emp => emp.userId)
        .filter((id): id is string => id !== null);
    if (userIds.length > 0) {
        const { notifyCalendar } = await import('../../notification/notification.helper');
        await notifyCalendar.holidayDeleted(userIds, holiday.name);
    }
}

/**
 * Format helper for holiday creation
 */
export function formatHolidayForCreation(calendarId: string, h: HolidayDto) {
    return {
        calendarId,
        startDate: new Date(h.startDate),
        endDate: new Date(h.endDate),
        name: h.name
    };
}
