import { prisma } from '@/utils/prisma';
import {
    PaginationParams,
    CreateCalendarInput,
    UpdateCalendarInput,
    CreateWeeklyRuleInput,
    UpdateWeeklyRuleInput,
    CreateHolidayInput,
    UpdateHolidayInput
} from './calendars.types';

// --- Calendars ---

export const create = async (data: CreateCalendarInput) => {
    return await prisma.calendar.create({
        data,
        include: { weeklyRules: true, holidays: true }
    });
};

export const findById = async (id: string) => {
    return await prisma.calendar.findUnique({
        where: { id },
        include: { weeklyRules: true, holidays: true }
    });
};

interface CalendarFilter extends PaginationParams {
    companyId?: string;
}

export const findAll = async (filter: CalendarFilter = {}) => {
    const { companyId, page = 1, limit = 10, search } = filter;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (companyId) where.companyId = companyId;
    if (search) {
        where.name = { contains: search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
        prisma.calendar.findMany({
            where,
            include: { weeklyRules: true, holidays: true },
            orderBy: { name: 'asc' },
            skip,
            take: limit,
        }),
        prisma.calendar.count({ where })
    ]);

    return {
        data,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
};

export const update = async (id: string, data: UpdateCalendarInput) => {
    return await prisma.calendar.update({
        where: { id },
        data,
        include: { weeklyRules: true, holidays: true }
    });
};

export const remove = async (id: string) => {
    return await prisma.calendar.delete({
        where: { id }
    });
};

// --- Weekly Rules ---

export const createWeeklyRule = async (data: CreateWeeklyRuleInput) => {
    return await prisma.calendarWeeklyRule.create({ data });
};

export const findWeeklyRules = async (calendarId: string) => {
    return await prisma.calendarWeeklyRule.findMany({
        where: { calendarId },
        orderBy: { dayOfWeek: 'asc' }
    });
};

export const findWeeklyRuleById = async (id: string) => {
    return await prisma.calendarWeeklyRule.findUnique({ where: { id }, include: { calendar: true } });
};

export const updateWeeklyRule = async (id: string, data: UpdateWeeklyRuleInput) => {
    return await prisma.calendarWeeklyRule.update({
        where: { id },
        data
    });
};

export const deleteWeeklyRule = async (id: string) => {
    return await prisma.calendarWeeklyRule.delete({ where: { id } });
};

// --- Holidays ---

export const createHoliday = async (data: CreateHolidayInput) => {
    return await prisma.calendarHoliday.create({ data });
};

export const findHolidays = async (calendarId: string, year?: number, search?: string) => {
    const whereClause: any = { calendarId };

    if (year) {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31);
        whereClause.date = {
            gte: startDate,
            lte: endDate
        };
    }

    if (search) {
        whereClause.name = { contains: search, mode: 'insensitive' };
    }

    return await prisma.calendarHoliday.findMany({
        where: whereClause,
        orderBy: { date: 'asc' }
    });
};

export const findHolidayById = async (id: string) => {
    return await prisma.calendarHoliday.findUnique({ where: { id }, include: { calendar: true } });
};

export const updateHoliday = async (id: string, data: UpdateHolidayInput) => {
    return await prisma.calendarHoliday.update({
        where: { id },
        data
    });
};

export const deleteHoliday = async (id: string) => {
    return await prisma.calendarHoliday.delete({ where: { id } });
};
