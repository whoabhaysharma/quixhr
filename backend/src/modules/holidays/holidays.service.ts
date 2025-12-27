import prisma from '../../shared/services/prisma';

export const holidayService = {
    // Create a new holiday
    createHoliday: async (data: {
        name: string;
        date: Date;
        endDate?: Date;
        description?: string;
        calendarId: string;
    }) => {
        return await prisma.holiday.create({
            data,
        });
    },

    // Get all holidays for a calendar
    getHolidaysByCalendar: async (calendarId: string) => {
        return await prisma.holiday.findMany({
            where: { calendarId },
            orderBy: { date: 'asc' },
        });
    },

    // Get upcoming holidays for a user
    getUpcomingHolidays: async (userId: string | number, limit: number = 5) => {
        const user = await prisma.user.findUnique({
            where: { id: String(userId) },
            select: { holidayCalendarId: true },
        });

        if (!user?.holidayCalendarId) {
            return [];
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return await prisma.holiday.findMany({
            where: {
                calendarId: user.holidayCalendarId,
                date: {
                    gte: today,
                },
            },
            orderBy: { date: 'asc' },
            take: limit,
        });
    },

    // Update holiday
    updateHoliday: async (
        id: string,
        data: {
            name?: string;
            date?: Date;
            endDate?: Date | null;
            description?: string;
        }
    ) => {
        return await prisma.holiday.update({
            where: { id },
            data,
        });
    },

    // Delete holiday
    deleteHoliday: async (id: string) => {
        return await prisma.holiday.delete({
            where: { id },
        });
    },

    // Bulk create holidays
    bulkCreateHolidays: async (
        calendarId: string,
        holidays: Array<{
            name: string;
            date: Date;
            endDate?: Date;
            description?: string;
        }>
    ) => {
        const holidaysWithCalendar = holidays.map((h) => ({
            ...h,
            calendarId,
        }));

        return await prisma.holiday.createMany({
            data: holidaysWithCalendar,
            skipDuplicates: true, // Skip if holiday already exists on that date
        });
    },
};
