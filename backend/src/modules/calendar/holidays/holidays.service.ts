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
    return prisma.calendarHoliday.create({
        data: {
            calendarId,
            name: dto.name,
            startDate: new Date(dto.startDate),
            endDate: new Date(dto.endDate),
        }
    });
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
    // Verify it belongs to the calendar
    const count = await prisma.calendarHoliday.deleteMany({
        where: {
            id: holidayId,
            calendarId
        }
    });

    if (count.count === 0) {
        throw new Error('Holiday not found or does not belong to this calendar');
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
