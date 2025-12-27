import { Request, Response } from 'express';
import { holidayService } from './holidays.service';

export const HolidayController = {
    // Create a new holiday
    createHoliday: async (req: Request, res: Response) => {
        try {
            const { name, date, endDate, description, calendarId } = req.body;

            const holiday = await holidayService.createHoliday({
                name,
                date: new Date(date),
                endDate: endDate ? new Date(endDate) : undefined,
                description,
                calendarId,
            });

            res.status(201).json({
                success: true,
                data: { holiday },
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: { message: error.message },
            });
        }
    },

    // Get holidays by calendar
    getHolidaysByCalendar: async (req: Request, res: Response) => {
        try {
            const { calendarId } = req.params;

            const holidays = await holidayService.getHolidaysByCalendar(calendarId);

            res.json({
                success: true,
                data: { holidays },
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: { message: error.message },
            });
        }
    },

    // Get upcoming holidays for user
    getUpcomingHolidays: async (req: Request, res: Response) => {
        try {
            const userId = req.user!.id;
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;

            const holidays = await holidayService.getUpcomingHolidays(userId, limit);

            res.json({
                success: true,
                data: { holidays },
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: { message: error.message },
            });
        }
    },

    // Update holiday
    updateHoliday: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { name, date, endDate, description } = req.body;

            const holiday = await holidayService.updateHoliday(id, {
                name,
                date: date ? new Date(date) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
                description,
            });

            res.json({
                success: true,
                data: { holiday },
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: { message: error.message },
            });
        }
    },

    // Delete holiday
    deleteHoliday: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            await holidayService.deleteHoliday(id);

            res.json({
                success: true,
                data: { message: 'Holiday deleted successfully' },
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: { message: error.message },
            });
        }
    },

    // Bulk create holidays
    bulkCreateHolidays: async (req: Request, res: Response) => {
        try {
            const { calendarId, holidays } = req.body;

            if (!Array.isArray(holidays)) {
                return res.status(400).json({
                    success: false,
                    error: { message: 'holidays must be an array' },
                });
            }

            const holidaysWithDates = holidays.map((h: any) => ({
                ...h,
                date: new Date(h.date),
                endDate: h.endDate ? new Date(h.endDate) : undefined,
            }));

            const result = await holidayService.bulkCreateHolidays(calendarId, holidaysWithDates);

            res.status(201).json({
                success: true,
                data: { count: result.count },
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: { message: error.message },
            });
        }
    },
};
