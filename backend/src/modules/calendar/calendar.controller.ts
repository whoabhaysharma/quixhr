import { Request, Response } from 'express';
import * as CalendarService from './calendar.service';
import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';

/**
 * @desc    List all calendars/shifts
 * @route   GET /api/v1/calendars
 * @access  HR Admin
 */
export const listCalendars = catchAsync(async (req: Request, res: Response) => {
    const companyId = req.targetCompanyId;

    if (!companyId) {
        return res.status(400).json({ message: 'Company ID is required' });
    }

    const calendars = await CalendarService.listCalendars(companyId);

    sendResponse(res, 200, { calendars, count: calendars.length }, 'Calendars retrieved successfully');
});

/**
 * @desc    Create a new calendar/shift
 * @route   POST /api/v1/calendars
 * @access  HR Admin
 */
export const createCalendar = catchAsync(async (req: Request, res: Response) => {
    const companyId = req.targetCompanyId;

    if (!companyId) {
        return res.status(400).json({ message: 'Company ID is required' });
    }

    const calendar = await CalendarService.createCalendar(companyId, req.body);

    sendResponse(res, 201, { calendar }, 'Calendar created successfully');
});

/**
 * @desc    Update calendar timings
 * @route   PATCH /api/v1/calendars/:id
 * @access  HR Admin
 */
export const updateCalendar = catchAsync(async (req: Request, res: Response) => {
    const companyId = req.targetCompanyId;
    const { id } = req.params;

    if (!companyId) {
        return res.status(400).json({ message: 'Company ID is required' });
    }

    const calendar = await CalendarService.updateCalendar(id, companyId, req.body);

    sendResponse(res, 200, { calendar }, 'Calendar updated successfully');
});

/**
 * @desc    Set weekly rules for a calendar
 * @route   PUT /api/v1/calendars/:id/weekly-rules
 * @access  HR Admin
 */
export const setWeeklyRules = catchAsync(async (req: Request, res: Response) => {
    const companyId = req.targetCompanyId;
    const { id } = req.params;

    if (!companyId) {
        return res.status(400).json({ message: 'Company ID is required' });
    }

    const calendar = await CalendarService.setWeeklyRules(id, companyId, req.body);

    sendResponse(res, 200, { calendar }, 'Weekly rules updated successfully');
});

/**
 * @desc    Get holidays for a calendar
 * @route   GET /api/v1/calendars/:id/holidays
 * @access  All
 */
export const getHolidays = catchAsync(async (req: Request, res: Response) => {
    const companyId = req.targetCompanyId;
    const { id } = req.params;

    if (!companyId) {
        return res.status(400).json({ message: 'Company ID is required' });
    }

    const holidays = await CalendarService.getHolidays(id, companyId);

    sendResponse(res, 200, { holidays, count: holidays.length }, 'Holidays retrieved successfully');
});

/**
 * @desc    Add a holiday (single or bulk)
 * @route   POST /api/v1/calendars/:id/holidays
 * @access  HR Admin
 */
export const createHolidays = catchAsync(async (req: Request, res: Response) => {
    const companyId = req.targetCompanyId;
    const { id } = req.params;

    if (!companyId) {
        return res.status(400).json({ message: 'Company ID is required' });
    }

    // Check if it's bulk upload (has 'holidays' array) or single holiday
    if (req.body.holidays && Array.isArray(req.body.holidays)) {
        // Bulk upload
        const results = await CalendarService.bulkCreateHolidays(id, companyId, req.body);

        sendResponse(
            res,
            200,
            results,
            `Bulk upload completed. Success: ${results.success.length}, Failed: ${results.failed.length}`
        );
    } else {
        // Single holiday
        const holiday = await CalendarService.createHoliday(id, companyId, req.body);

        sendResponse(res, 201, { holiday }, 'Holiday created successfully');
    }
});

/**
 * @desc    Delete a holiday
 * @route   DELETE /api/v1/calendars/:id/holidays/:hid
 * @access  HR Admin
 */
export const deleteHoliday = catchAsync(async (req: Request, res: Response) => {
    const companyId = req.targetCompanyId;
    const { id, hid } = req.params;

    if (!companyId) {
        return res.status(400).json({ message: 'Company ID is required' });
    }

    const result = await CalendarService.deleteHoliday(id, hid, companyId);

    sendResponse(res, 200, result, 'Holiday deleted successfully');
});

/**
 * @desc    Check if a date is working/off/holiday
 * @route   GET /api/v1/calendars/check-date
 * @access  System/All
 */
export const checkDate = catchAsync(async (req: Request, res: Response) => {
    const result = await CalendarService.checkDate(req.query as any);

    sendResponse(res, 200, result, 'Date checked successfully');
});
