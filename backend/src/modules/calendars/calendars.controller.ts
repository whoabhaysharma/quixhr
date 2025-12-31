import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';
import { CalendarService } from './calendars.service';
import { AuthContext } from './calendars.types';
import { AppError } from '@/utils/appError';
import {
  CalendarResponseDto,
  CalendarDetailsResponseDto,
  WeeklyRuleResponseDto,
  HolidayResponseDto,
  CalendarsListResponseDto,
  WeeklyRulesListResponseDto,
  HolidaysListResponseDto,
} from './calendars.schema';

// =========================================================================
// HELPER FUNCTIONS
// =========================================================================

/**
 * Get auth context from request
 */
const getAuthContext = (req: Request): AuthContext => {
  const user = (req as any).user;
  if (!user) {
    throw new AppError('User not authenticated', 401);
  }
  return user as AuthContext;
};

// =========================================================================
// CALENDAR ENDPOINTS
// =========================================================================

/**
 * @desc    Get all calendars for user's company
 * @route   GET /api/v1/calendars
 * @access  Protected (SUPER_ADMIN only)
 */
export const getCalendars = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authContext = getAuthContext(req);
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const name = (req.query.name as string) || undefined;

    const result = await CalendarService.getCalendars({
      authContext,
      page,
      limit,
      name,
    });

    const responseData: CalendarsListResponseDto = {
      success: true,
      message: 'Calendars retrieved successfully',
      data: {
        calendars: result.calendars,
        pagination: result.pagination,
      },
    };

    sendResponse(res, 200, responseData);
  }
);
/**
 * @desc    Get calendar details by ID
 * @route   GET /api/v1/calendars/:calendarId
 * @access  Protected (All authenticated users, scoped to their company)
 */
export const getCalendarById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authContext = getAuthContext(req);
    const { calendarId } = req.params;

    const calendar = await CalendarService.getCalendarById({
      authContext,
      calendarId,
    });

    const responseData: CalendarDetailsResponseDto = {
      success: true,
      message: 'Calendar details retrieved successfully',
      data: calendar,
    };

    sendResponse(res, 200, responseData);
  }
);

/**
 * @desc    Create a new calendar
 * @route   POST /api/v1/calendars
 * @access  Protected (SUPER_ADMIN only)
 */
export const createCalendar = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authContext = getAuthContext(req);
    
    const calendar = await CalendarService.createCalendar({
      authContext,
      data: req.body,
    });

    const responseData: CalendarResponseDto = {
      success: true,
      message: 'Calendar created successfully',
      data: calendar,
    };

    sendResponse(res, 201, responseData);
  }
);

/**
 * @desc    Update calendar
 * @route   PATCH /api/v1/calendars/:calendarId
 * @access  Protected (SUPER_ADMIN only)
 */
export const updateCalendar = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authContext = getAuthContext(req);
    const { calendarId } = req.params;

    const calendar = await CalendarService.updateCalendar({
      authContext,
      calendarId,
      data: req.body,
    });

    const responseData: CalendarResponseDto = {
      success: true,
      message: 'Calendar updated successfully',
      data: calendar,
    };

    sendResponse(res, 200, responseData);
  }
);
/**
 * @desc    Delete calendar
 * @route   DELETE /api/v1/calendars/:calendarId
 * @access  Protected (SUPER_ADMIN only)
 */
export const deleteCalendar = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authContext = getAuthContext(req);
    const { calendarId } = req.params;

    await CalendarService.deleteCalendar({
      authContext,
      calendarId,
    });

    const responseData = {
      success: true,
      message: 'Calendar deleted successfully',
      data: null,
    };

    sendResponse(res, 200, responseData);
  }
);

// =========================================================================
// WEEKLY RULES ENDPOINTS
// =========================================================================

/**
 * @desc    Get weekly rules for a calendar
 * @route   GET /api/v1/calendars/:calendarId/weekly-rules
 * @access  Protected (All authenticated users, scoped to their company)
 */
export const getWeeklyRules = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authContext = getAuthContext(req);
    const { calendarId } = req.params;

    const rules = await CalendarService.getWeeklyRules({
      authContext,
      calendarId,
    });

    const responseData: WeeklyRulesListResponseDto = {
      success: true,
      message: 'Weekly rules retrieved successfully',
      data: {
        rules,
        total: rules.length,
      },
    };

    sendResponse(res, 200, responseData);
  }
);

/**
 * @desc    Create weekly rule for calendar
 * @route   POST /api/v1/calendars/:calendarId/weekly-rules
 * @access  Protected (SUPER_ADMIN only)
 */
export const createWeeklyRule = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authContext = getAuthContext(req);
    const { calendarId } = req.params;

    const rule = await CalendarService.createWeeklyRule({
      authContext,
      calendarId,
      data: req.body,
    });

    const responseData: WeeklyRuleResponseDto = {
      success: true,
      message: 'Weekly rule created successfully',
      data: rule,
    };

    sendResponse(res, 201, responseData);
  }
);

/**
 * @desc    Update weekly rule
 * @route   PATCH /api/v1/calendars/:calendarId/weekly-rules/:ruleId
 * @access  Protected (SUPER_ADMIN only)
 */
export const updateWeeklyRule = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authContext = getAuthContext(req);
    const { calendarId, ruleId } = req.params;

    const rule = await CalendarService.updateWeeklyRule({
      authContext,
      calendarId,
      ruleId,
      data: req.body,
    });

    const responseData: WeeklyRuleResponseDto = {
      success: true,
      message: 'Weekly rule updated successfully',
      data: rule,
    };

    sendResponse(res, 200, responseData);
  }
);

/**
 * @desc    Delete weekly rule
 * @route   DELETE /api/v1/calendars/:calendarId/weekly-rules/:ruleId
 * @access  Protected (SUPER_ADMIN only)
 */
export const deleteWeeklyRule = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authContext = getAuthContext(req);
    const { calendarId, ruleId } = req.params;

    await CalendarService.deleteWeeklyRule({
      authContext,
      calendarId,
      ruleId,
    });

    const responseData = {
      success: true,
      message: 'Weekly rule deleted successfully',
      data: null,
    };

    sendResponse(res, 200, responseData);
  }
);

// =========================================================================
// HOLIDAY ENDPOINTS
// =========================================================================

/**
 * @desc    Get holidays for a calendar
 * @route   GET /api/v1/calendars/:calendarId/holidays
 * @access  Protected (All authenticated users, scoped to their company)
 */
export const getHolidays = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authContext = getAuthContext(req);
    const { calendarId } = req.params;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();

    const holidays = await CalendarService.getHolidays({
      authContext,
      calendarId,
      year,
    });

    const responseData: HolidaysListResponseDto = {
      success: true,
      message: 'Holidays retrieved successfully',
      data: {
        holidays,
        total: holidays.length,
      },
    };

    sendResponse(res, 200, responseData);
  }
);

/**
 * @desc    Create holiday for calendar
 * @route   POST /api/v1/calendars/:calendarId/holidays
 * @access  Protected (SUPER_ADMIN only)
 */
export const createHoliday = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authContext = getAuthContext(req);
    const { calendarId } = req.params;

    const holiday = await CalendarService.createHoliday({
      authContext,
      calendarId,
      data: req.body,
    });

    const responseData: HolidayResponseDto = {
      success: true,
      message: 'Holiday created successfully',
      data: holiday,
    };

    sendResponse(res, 201, responseData);
  }
);

/**
 * @desc    Update holiday
 * @route   PATCH /api/v1/calendars/:calendarId/holidays/:holidayId
 * @access  Protected (SUPER_ADMIN only)
 */
export const updateHoliday = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authContext = getAuthContext(req);
    const { calendarId, holidayId } = req.params;

    const holiday = await CalendarService.updateHoliday({
      authContext,
      calendarId,
      holidayId,
      data: req.body,
    });

    const responseData: HolidayResponseDto = {
      success: true,
      message: 'Holiday updated successfully',
      data: holiday,
    };

    sendResponse(res, 200, responseData);
  }
);

/**
 * @desc    Delete holiday
 * @route   DELETE /api/v1/calendars/:calendarId/holidays/:holidayId
 * @access  Protected (SUPER_ADMIN only)
 */
export const deleteHoliday = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authContext = getAuthContext(req);
    const { calendarId, holidayId } = req.params;

    await CalendarService.deleteHoliday({
      authContext,
      calendarId,
      holidayId,
    });

    const responseData = {
      success: true,
      message: 'Holiday deleted successfully',
      data: null,
    };

    sendResponse(res, 200, responseData);
  }
);