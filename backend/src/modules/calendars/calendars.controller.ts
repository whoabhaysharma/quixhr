import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';
import { getOrganizationContext } from '@/utils/tenantContext';
import { getPaginationParams } from '@/utils/pagination';
import { CalendarService } from './calendars.service';
import {
    CreateCalendarInput,
    UpdateCalendarInput,
    CreateWeeklyRuleInput,
    UpdateWeeklyRuleInput,
    CreateHolidayInput,
    UpdateHolidayInput
} from './calendars.schema';

// =========================================================================
// 1. CALENDAR CONTROLLERS
// =========================================================================

export const createCalendar = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = getOrganizationContext(req, next);
    const result = await CalendarService.createCalendar(organizationId, req.body as CreateCalendarInput);
    sendResponse(res, 201, result, 'Calendar created successfully');
});

export const getCalendars = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = getOrganizationContext(req, next);
    const pagination = getPaginationParams(req, 'name', 'asc');

    // Filters could be extracted from req.query if needed, currently empty
    const result = await CalendarService.getCalendars(organizationId, pagination, {});
    sendResponse(res, 200, result, 'Calendars retrieved successfully');
});

export const getCalendarById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = getOrganizationContext(req, next);
    const { id } = req.params;
    const result = await CalendarService.getCalendar(organizationId, id);
    sendResponse(res, 200, result, 'Calendar retrieved successfully');
});

// Alias for backwards compatibility if referenced by name elsewhere
export const getCalendar = getCalendarById;

export const updateCalendar = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = getOrganizationContext(req, next);
    const { id } = req.params;
    const result = await CalendarService.updateCalendar(organizationId, id, req.body as UpdateCalendarInput);
    sendResponse(res, 200, result, 'Calendar updated successfully');
});

export const deleteCalendar = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = getOrganizationContext(req, next);
    const { id } = req.params;
    await CalendarService.deleteCalendar(organizationId, id);
    sendResponse(res, 204, null, 'Calendar deleted successfully');
});

// =========================================================================
// 2. WEEKLY RULES CONTROLLERS
// =========================================================================

export const getWeeklyRules = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = getOrganizationContext(req, next);
    const { calendarId } = req.params;
    const result = await CalendarService.getWeeklyRules(organizationId, calendarId);
    sendResponse(res, 200, result, 'Weekly rules retrieved successfully');
});

export const createWeeklyRule = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = getOrganizationContext(req, next);
    const { calendarId } = req.params;
    // req.body is validated, includes dayOfWeek etc.
    const result = await CalendarService.createWeeklyRule(organizationId, calendarId, req.body as CreateWeeklyRuleInput);
    sendResponse(res, 201, result, 'Weekly rule created successfully');
});

export const updateWeeklyRule = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = getOrganizationContext(req, next);
    const { ruleId } = req.params;
    const result = await CalendarService.updateWeeklyRule(organizationId, ruleId, req.body as UpdateWeeklyRuleInput);
    sendResponse(res, 200, result, 'Weekly rule updated successfully');
});

export const deleteWeeklyRule = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = getOrganizationContext(req, next);
    const { ruleId } = req.params;
    await CalendarService.deleteWeeklyRule(organizationId, ruleId);
    sendResponse(res, 204, null, 'Weekly rule deleted successfully');
});

// =========================================================================
// 3. HOLIDAYS CONTROLLERS
// =========================================================================

export const getHolidays = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = getOrganizationContext(req, next);
    const { calendarId } = req.params;
    const year = req.query.year ? Number(req.query.year) : undefined;
    const search = req.query.search as string;

    const result = await CalendarService.getHolidays(organizationId, calendarId, year, search);
    sendResponse(res, 200, result, 'Holidays retrieved successfully');
});

export const createHoliday = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = getOrganizationContext(req, next);
    const { calendarId } = req.params;
    const result = await CalendarService.createHoliday(organizationId, calendarId, req.body as CreateHolidayInput);
    sendResponse(res, 201, result, 'Holiday created successfully');
});

export const updateHoliday = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = getOrganizationContext(req, next);
    const { holidayId } = req.params;
    const result = await CalendarService.updateHoliday(organizationId, holidayId, req.body as UpdateHolidayInput);
    sendResponse(res, 200, result, 'Holiday updated successfully');
});

export const deleteHoliday = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = getOrganizationContext(req, next);
    const { holidayId } = req.params;
    await CalendarService.deleteHoliday(organizationId, holidayId);
    sendResponse(res, 204, null, 'Holiday deleted successfully');
});
