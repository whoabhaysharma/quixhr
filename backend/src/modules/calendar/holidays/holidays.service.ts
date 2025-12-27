import { PrismaClient } from '@prisma/client';
import { HolidayDto } from './holidays.types';

const prisma = new PrismaClient();

// In the future, specific holiday CRUD can be added here.
// For now, we are primarily using bulk operations in calendar.service.ts,
// but we can expose helpers if needed.

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
