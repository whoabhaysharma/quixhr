import { prisma } from '@/utils/prisma';
import { AppError } from '@/utils/appError';
import { ParsedPagination } from '@/utils/pagination';
import { buildOrderBy, validateOrganizationResource } from '@/utils/prismaHelpers';
import {
    CreateCalendarInput,
    UpdateCalendarInput,
    GetCalendarsQuery,
    CreateWeeklyRuleInput,
    UpdateWeeklyRuleInput,
    CreateHolidayInput,
    UpdateHolidayInput
} from './calendars.schema';

export class CalendarService {
    // =========================================================================
    // CALENDARS
    // =========================================================================

    static async getCalendars(
        organizationId: string,
        query: ParsedPagination,
        filters: Pick<GetCalendarsQuery, never> // Add specific filters here if needed
    ) {
        const { page, limit, skip, search, sortBy, sortOrder } = query;

        const where: any = { organizationId };

        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }

        const orderBy = buildOrderBy(sortBy, sortOrder, {
            allowedFields: ['name', 'dayStartTime', 'dayEndTime', 'createdAt', 'updatedAt'],
            defaultSort: { name: 'asc' }
        });

        const [calendars, total] = await Promise.all([
            prisma.calendar.findMany({
                where,
                skip,
                take: limit,
                orderBy: orderBy as any,
                include: { weeklyRules: true, holidays: true }
            }),
            prisma.calendar.count({ where })
        ]);

        return {
            data: calendars,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    static async getCalendar(organizationId: string, id: string) {
        // We use explicit query to get relations
        const calendar = await prisma.calendar.findUnique({
            where: { id },
            include: { weeklyRules: true, holidays: true }
        });

        if (!calendar) throw new AppError('Calendar not found', 404);
        if (calendar.organizationId !== organizationId) throw new AppError('Access denied', 403);

        return calendar;
    }

    static async createCalendar(organizationId: string, data: CreateCalendarInput) {
        // Unique name check within org? Optional but good practice.
        const existing = await prisma.calendar.findFirst({
            where: { organizationId, name: { equals: data.name, mode: 'insensitive' } }
        });
        if (existing) throw new AppError('Calendar with this name already exists', 400);

        return await prisma.calendar.create({
            data: {
                ...data,
                organizationId
            },
            include: { weeklyRules: true, holidays: true }
        });
    }

    static async updateCalendar(organizationId: string, id: string, data: UpdateCalendarInput) {
        await validateOrganizationResource('calendar', id, organizationId, 'Calendar');

        if (data.name) {
            const existing = await prisma.calendar.findFirst({
                where: { organizationId, name: { equals: data.name, mode: 'insensitive' }, id: { not: id } }
            });
            if (existing) throw new AppError('Calendar with this name already exists', 400);
        }

        return await prisma.calendar.update({
            where: { id },
            data,
            include: { weeklyRules: true, holidays: true }
        });
    }

    static async deleteCalendar(organizationId: string, id: string) {
        await validateOrganizationResource('calendar', id, organizationId, 'Calendar');

        // Check dependencies (Employees)
        const employees = await prisma.employee.count({ where: { calendarId: id } });
        if (employees > 0) {
            throw new AppError('Cannot delete calendar assigned to employees. Reassign them first.', 400);
        }

        await prisma.calendar.delete({ where: { id } });
    }

    // =========================================================================
    // WEEKLY RULES
    // =========================================================================

    static async getWeeklyRules(organizationId: string, calendarId: string) {
        await validateOrganizationResource('calendar', calendarId, organizationId, 'Calendar');

        return await prisma.calendarWeeklyRule.findMany({
            where: { calendarId },
            orderBy: { dayOfWeek: 'asc' }
        });
    }

    static async createWeeklyRule(organizationId: string, calendarId: string, data: CreateWeeklyRuleInput) {
        await validateOrganizationResource('calendar', calendarId, organizationId, 'Calendar');

        // Logic check: Avoid duplicate rule for same day? 
        // Or multiple rules allowed? Usually one rule per day-strategy, but let's trust input for now.

        return await prisma.calendarWeeklyRule.create({
            data: {
                ...data,
                calendarId
            }
        });
    }

    static async updateWeeklyRule(organizationId: string, ruleId: string, data: UpdateWeeklyRuleInput) {
        // Access check through parent calendar
        const rule = await prisma.calendarWeeklyRule.findUnique({
            where: { id: ruleId },
            include: { calendar: true }
        });

        if (!rule) throw new AppError('Weekly rule not found', 404);
        if (rule.calendar.organizationId !== organizationId) throw new AppError('Access denied', 403);

        return await prisma.calendarWeeklyRule.update({
            where: { id: ruleId },
            data
        });
    }

    static async deleteWeeklyRule(organizationId: string, ruleId: string) {
        const rule = await prisma.calendarWeeklyRule.findUnique({
            where: { id: ruleId },
            include: { calendar: true }
        });

        if (!rule) throw new AppError('Weekly rule not found', 404);
        if (rule.calendar.organizationId !== organizationId) throw new AppError('Access denied', 403);

        await prisma.calendarWeeklyRule.delete({ where: { id: ruleId } });
    }

    // =========================================================================
    // HOLIDAYS
    // =========================================================================

    static async getHolidays(organizationId: string, calendarId: string, year?: number, search?: string) {
        await validateOrganizationResource('calendar', calendarId, organizationId, 'Calendar');

        const where: any = { calendarId };

        if (year) {
            const startDate = new Date(year, 0, 1);
            const endDate = new Date(year, 11, 31);
            where.date = { gte: startDate, lte: endDate };
        }

        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }

        return await prisma.calendarHoliday.findMany({
            where,
            orderBy: { date: 'asc' }
        });
    }

    static async createHoliday(organizationId: string, calendarId: string, data: CreateHolidayInput) {
        await validateOrganizationResource('calendar', calendarId, organizationId, 'Calendar');

        const date = new Date(data.date); // validated by Zod but ensure Date object

        return await prisma.calendarHoliday.create({
            data: {
                ...data,
                date,
                calendarId
            }
        });
    }

    static async updateHoliday(organizationId: string, holidayId: string, data: UpdateHolidayInput) {
        const holiday = await prisma.calendarHoliday.findUnique({
            where: { id: holidayId },
            include: { calendar: true }
        });

        if (!holiday) throw new AppError('Holiday not found', 404);
        if (holiday.calendar.organizationId !== organizationId) throw new AppError('Access denied', 403);

        const updateData: any = { ...data };
        if (data.date) updateData.date = new Date(data.date);

        return await prisma.calendarHoliday.update({
            where: { id: holidayId },
            data: updateData
        });
    }

    static async deleteHoliday(organizationId: string, holidayId: string) {
        const holiday = await prisma.calendarHoliday.findUnique({
            where: { id: holidayId },
            include: { calendar: true }
        });

        if (!holiday) throw new AppError('Holiday not found', 404);
        if (holiday.calendar.organizationId !== organizationId) throw new AppError('Access denied', 403);

        await prisma.calendarHoliday.delete({ where: { id: holidayId } });
    }
}
