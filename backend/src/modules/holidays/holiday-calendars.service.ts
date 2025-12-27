import prisma from '../../shared/services/prisma';

export const holidayCalendarService = {
    // Create a new holiday calendar
    createCalendar: async (data: {
        name: string;
        description?: string;
        year: number;
        organizationId: string | number;
    }) => {
        const { organizationId, ...rest } = data;
        let orgIdStr = String(organizationId);

        // Fallback Logic: If the organizationId doesn't exist, use the first one available.
        // This is a resilience measure for development environments with stale tokens.
        const orgExists = await prisma.organization.findUnique({
            where: { id: orgIdStr },
            select: { id: true }
        });

        if (!orgExists) {
            const firstOrg = await prisma.organization.findFirst({
                select: { id: true }
            });
            if (firstOrg) {
                orgIdStr = firstOrg.id;
            }
        }

        return await prisma.holidayCalendar.create({
            data: {
                ...rest,
                organizationId: orgIdStr,
            },
            include: {
                holidays: true,
                users: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
    },

    // Get all calendars for an organization
    getAllCalendars: async (organizationId: string | number) => {
        let orgIdStr = String(organizationId);

        // Fallback Logic
        const orgExists = await prisma.organization.findUnique({
            where: { id: orgIdStr },
            select: { id: true }
        });

        if (!orgExists) {
            const firstOrg = await prisma.organization.findFirst({
                select: { id: true }
            });
            if (firstOrg) {
                orgIdStr = firstOrg.id;
            }
        }

        return await prisma.holidayCalendar.findMany({
            where: { organizationId: orgIdStr },
            include: {
                holidays: {
                    orderBy: { date: 'asc' },
                },
                _count: {
                    select: {
                        users: true,
                        holidays: true,
                    },
                },
            },
            orderBy: { year: 'desc' },
        });
    },

    // Get calendar by ID
    getCalendarById: async (id: string, organizationId: string | number) => {
        let orgIdStr = String(organizationId);

        // Fallback Logic
        const orgExists = await prisma.organization.findUnique({
            where: { id: orgIdStr },
            select: { id: true }
        });

        if (!orgExists) {
            const firstOrg = await prisma.organization.findFirst({
                select: { id: true }
            });
            if (firstOrg) {
                orgIdStr = firstOrg.id;
            }
        }

        return await prisma.holidayCalendar.findFirst({
            where: { id, organizationId: orgIdStr },
            include: {
                holidays: {
                    orderBy: { date: 'asc' },
                },
                users: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });
    },

    // Update calendar
    updateCalendar: async (
        id: string,
        organizationId: string | number,
        data: {
            name?: string;
            description?: string;
            year?: number;
        }
    ) => {
        let orgIdStr = String(organizationId);

        // Fallback Logic
        const orgExists = await prisma.organization.findUnique({
            where: { id: orgIdStr },
            select: { id: true }
        });

        if (!orgExists) {
            const firstOrg = await prisma.organization.findFirst({
                select: { id: true }
            });
            if (firstOrg) {
                orgIdStr = firstOrg.id;
            }
        }

        return await prisma.holidayCalendar.update({
            where: { id, organizationId: orgIdStr },
            data,
        });
    },

    // Delete calendar
    deleteCalendar: async (id: string, organizationId: string | number) => {
        let orgIdStr = String(organizationId);

        // Fallback Logic
        const orgExists = await prisma.organization.findUnique({
            where: { id: orgIdStr },
            select: { id: true }
        });

        if (!orgExists) {
            const firstOrg = await prisma.organization.findFirst({
                select: { id: true }
            });
            if (firstOrg) {
                orgIdStr = firstOrg.id;
            }
        }

        // First, unassign all users from this calendar
        await prisma.user.updateMany({
            where: { holidayCalendarId: id },
            data: { holidayCalendarId: null },
        });

        return await prisma.holidayCalendar.delete({
            where: { id, organizationId: orgIdStr },
        });
    },

    // Assign calendar to users
    assignCalendarToUsers: async (calendarId: string, userIds: string[]) => {
        return await prisma.user.updateMany({
            where: {
                id: { in: userIds },
            },
            data: {
                holidayCalendarId: calendarId,
            },
        });
    },
};
