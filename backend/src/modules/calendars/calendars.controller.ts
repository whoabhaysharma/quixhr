import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';
import { AppError } from '@/utils/appError';
import * as CalendarService from './calendars.service';
import { CreateCalendarInput, UpdateCalendarInput, CreateWeeklyRuleInput, UpdateWeeklyRuleInput, CreateHolidayInput, UpdateHolidayInput } from './calendars.types';

// =========================================================================
// 1. CALENDAR CONTROLLERS
// =========================================================================

export const createCalendar = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { companyId } = req.params;

    // Authorization: User must belong to this company (or be Super Admin)
    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.companyId !== companyId) {
        return next(new AppError('You do not have permission to create a calendar for this company', 403));
    }

    const input: CreateCalendarInput = {
        ...req.body,
        companyId
    };

    const calendar = await CalendarService.create(input);
    sendResponse(res, 201, calendar, 'Calendar created successfully');
});

export const getCalendarById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // Supports both :id and :calendarId param names
    const id = req.params.id || req.params.calendarId;
    const companyId = req.targetCompanyId;

    const calendar = await CalendarService.findById(id);

    if (!calendar) {
        return next(new AppError('Calendar not found', 404));
    }

    // Authorization
    if (req.user!.role !== 'SUPER_ADMIN' && companyId && calendar.companyId !== companyId) {
        return next(new AppError('You do not have permission to view this calendar', 403));
    }

    sendResponse(res, 200, calendar, 'Calendar retrieved successfully');
});

// Alias for backward compatibility if needed, but routes should point to getCalendarById
export const getCalendar = getCalendarById;

export const getCalendars = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // targetCompanyId is set by resolveTenant middleware
    const companyId = req.targetCompanyId;

    if (!companyId) {
        return next(new AppError('Company context is required', 400));
    }

    let filter: { companyId: string; page?: number; limit?: number; search?: string } = {
        companyId,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
        search: req.query.search as string
    };

    const result = await CalendarService.findAll(filter);
    sendResponse(res, 200, result, 'Calendars retrieved successfully');
});

export const updateCalendar = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id || req.params.calendarId;
    const existing = await CalendarService.findById(id);
    if (!existing) { return next(new AppError('Calendar not found', 404)); }

    if (req.user!.role !== 'SUPER_ADMIN' && existing.companyId !== req.user!.companyId) {
        return next(new AppError('You do not have permission to update this calendar', 403));
    }

    const calendar = await CalendarService.update(id, req.body as UpdateCalendarInput);
    sendResponse(res, 200, calendar, 'Calendar updated successfully');
});

export const deleteCalendar = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id || req.params.calendarId;
    const existing = await CalendarService.findById(id);
    if (!existing) { return next(new AppError('Calendar not found', 404)); }

    if (req.user!.role !== 'SUPER_ADMIN' && existing.companyId !== req.user!.companyId) {
        return next(new AppError('You do not have permission to delete this calendar', 403));
    }

    await CalendarService.remove(id);
    sendResponse(res, 204, null, 'Calendar deleted successfully');
});

// =========================================================================
// 2. WEEKLY RULES CONTROLLERS
// =========================================================================

export const getWeeklyRules = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { calendarId } = req.params;

    // Parent check
    const calendar = await CalendarService.findById(calendarId);
    if (!calendar) return next(new AppError('Calendar not found', 404));

    // Auth check
    if (req.user!.role !== 'SUPER_ADMIN' && calendar.companyId !== req.user!.companyId) {
        return next(new AppError('Permission denied', 403));
    }

    const rules = await CalendarService.findWeeklyRules(calendarId);
    sendResponse(res, 200, rules, 'Weekly rules retrieved successfully');
});

export const createWeeklyRule = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { calendarId } = req.params;

    // Parent check
    const calendar = await CalendarService.findById(calendarId);
    if (!calendar) return next(new AppError('Calendar not found', 404));

    // Auth check
    if (req.user!.role !== 'SUPER_ADMIN' && calendar.companyId !== req.user!.companyId) {
        return next(new AppError('Permission denied', 403));
    }

    const input: CreateWeeklyRuleInput = { ...req.body, calendarId };
    const rule = await CalendarService.createWeeklyRule(input);
    sendResponse(res, 201, rule, 'Weekly rule created successfully');
});

export const updateWeeklyRule = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { ruleId } = req.params;
    const existingRule = await CalendarService.findWeeklyRuleById(ruleId);
    if (!existingRule) return next(new AppError('Rule not found', 404));

    // Auth check
    if (req.user!.role !== 'SUPER_ADMIN' && existingRule.calendar.companyId !== req.user!.companyId) {
        return next(new AppError('Permission denied', 403));
    }

    const rule = await CalendarService.updateWeeklyRule(ruleId, req.body as UpdateWeeklyRuleInput);
    sendResponse(res, 200, rule, 'Weekly rule updated successfully');
});

export const deleteWeeklyRule = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { ruleId } = req.params;
    const existingRule = await CalendarService.findWeeklyRuleById(ruleId);
    if (!existingRule) return next(new AppError('Rule not found', 404));

    // Auth check
    if (req.user!.role !== 'SUPER_ADMIN' && existingRule.calendar.companyId !== req.user!.companyId) {
        return next(new AppError('Permission denied', 403));
    }

    await CalendarService.deleteWeeklyRule(ruleId);
    sendResponse(res, 204, null, 'Weekly rule deleted successfully');
});


// =========================================================================
// 3. HOLIDAYS CONTROLLERS
// =========================================================================

export const getHolidays = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { calendarId } = req.params;
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    const search = req.query.search as string;

    // Parent check
    const calendar = await CalendarService.findById(calendarId);
    if (!calendar) return next(new AppError('Calendar not found', 404));

    // Auth check
    if (req.user!.role !== 'SUPER_ADMIN' && calendar.companyId !== req.user!.companyId) {
        return next(new AppError('Permission denied', 403));
    }

    const holidays = await CalendarService.findHolidays(calendarId, year, search);
    sendResponse(res, 200, holidays, 'Holidays retrieved successfully');
});

export const createHoliday = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { calendarId } = req.params;

    // Parent check
    const calendar = await CalendarService.findById(calendarId);
    if (!calendar) return next(new AppError('Calendar not found', 404));

    // Auth check
    if (req.user!.role !== 'SUPER_ADMIN' && calendar.companyId !== req.user!.companyId) {
        return next(new AppError('Permission denied', 403));
    }

    // Ensure date is a Date object
    const date = new Date(req.body.date);

    const input: CreateHolidayInput = { ...req.body, date, calendarId };
    const holiday = await CalendarService.createHoliday(input);
    sendResponse(res, 201, holiday, 'Holiday created successfully');
});

export const updateHoliday = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { holidayId } = req.params;
    const existingHoliday = await CalendarService.findHolidayById(holidayId);
    if (!existingHoliday) return next(new AppError('Holiday not found', 404));

    // Auth check
    if (req.user!.role !== 'SUPER_ADMIN' && existingHoliday.calendar.companyId !== req.user!.companyId) {
        return next(new AppError('Permission denied', 403));
    }

    const input: UpdateHolidayInput = { ...req.body };
    if (input.date) {
        input.date = new Date(input.date);
    }

    const holiday = await CalendarService.updateHoliday(holidayId, input);
    sendResponse(res, 200, holiday, 'Holiday updated successfully');
});

export const deleteHoliday = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { holidayId } = req.params;
    const existingHoliday = await CalendarService.findHolidayById(holidayId);
    if (!existingHoliday) return next(new AppError('Holiday not found', 404));

    // Auth check
    if (req.user!.role !== 'SUPER_ADMIN' && existingHoliday.calendar.companyId !== req.user!.companyId) {
        return next(new AppError('Permission denied', 403));
    }

    await CalendarService.deleteHoliday(holidayId);
    sendResponse(res, 204, null, 'Holiday deleted successfully');
});
