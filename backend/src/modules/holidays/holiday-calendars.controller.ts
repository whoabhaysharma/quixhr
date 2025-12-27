import { Request, Response } from 'express';
import { holidayCalendarService } from './holiday-calendars.service';

export const HolidayCalendarController = {
    // Create a new holiday calendar
    createCalendar: async (req: Request, res: Response) => {
        try {
            const { name, description, year } = req.body;
            const organizationId = req.user!.organizationId;

            if (!organizationId) {
                return res.status(400).json({
                    success: false,
                    error: { message: 'User must belong to an organization' },
                });
            }

            const calendar = await holidayCalendarService.createCalendar({
                name,
                description,
                year: parseInt(year),
                organizationId,
            });

            res.status(201).json({
                success: true,
                data: { calendar },
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: { message: error.message },
            });
        }
    },

    // Get all calendars for organization
    getAllCalendars: async (req: Request, res: Response) => {
        try {
            const organizationId = req.user!.organizationId;

            if (!organizationId) {
                return res.status(400).json({
                    success: false,
                    error: { message: 'User must belong to an organization' },
                });
            }

            const calendars = await holidayCalendarService.getAllCalendars(organizationId);

            res.json({
                success: true,
                data: { calendars },
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: { message: error.message },
            });
        }
    },

    // Get calendar by ID
    getCalendarById: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const organizationId = req.user!.organizationId;

            if (!organizationId) {
                return res.status(400).json({
                    success: false,
                    error: { message: 'User must belong to an organization' },
                });
            }

            const calendar = await holidayCalendarService.getCalendarById(id, organizationId);

            if (!calendar) {
                return res.status(404).json({
                    success: false,
                    error: { message: 'Calendar not found' },
                });
            }

            res.json({
                success: true,
                data: { calendar },
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: { message: error.message },
            });
        }
    },

    // Update calendar
    updateCalendar: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { name, description, year } = req.body;
            const organizationId = req.user!.organizationId;

            if (!organizationId) {
                return res.status(400).json({
                    success: false,
                    error: { message: 'User must belong to an organization' },
                });
            }

            const calendar = await holidayCalendarService.updateCalendar(id, organizationId, {
                name,
                description,
                year: year ? parseInt(year) : undefined,
            });

            res.json({
                success: true,
                data: { calendar },
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: { message: error.message },
            });
        }
    },

    // Delete calendar
    deleteCalendar: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const organizationId = req.user!.organizationId;

            if (!organizationId) {
                return res.status(400).json({
                    success: false,
                    error: { message: 'User must belong to an organization' },
                });
            }

            await holidayCalendarService.deleteCalendar(id, organizationId);

            res.json({
                success: true,
                data: { message: 'Calendar deleted successfully' },
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: { message: error.message },
            });
        }
    },

    // Assign calendar to users
    assignCalendarToUsers: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { userIds } = req.body;

            if (!Array.isArray(userIds)) {
                return res.status(400).json({
                    success: false,
                    error: { message: 'userIds must be an array' },
                });
            }

            await holidayCalendarService.assignCalendarToUsers(id, userIds);

            res.json({
                success: true,
                data: { message: 'Calendar assigned successfully' },
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: { message: error.message },
            });
        }
    },
};
