import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/utils/prisma';
import { AppError } from '@/utils/appError';
import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';
import { AuthContext, EmployeeContext } from './calendars.types';
import {
  CalendarResponseDto,
  CalendarDetailsResponseDto,
  WeeklyRuleResponseDto,
  HolidayResponseDto,
  CalendarsListResponseDto,
  WeeklyRulesListResponseDto,
  HolidaysListResponseDto,
  CreateCalendarRequestDto,
  UpdateCalendarRequestDto,
  CreateWeeklyRuleRequestDto,
  UpdateWeeklyRuleRequestDto,
  CreateHolidayRequestDto,
  UpdateHolidayRequestDto,
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

/**
 * Get employee context for company validation
 */
const getEmployeeContext = async (userId: string): Promise<EmployeeContext> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      employee: {
        include: {
          company: true,
        },
      },
    },
  });

  if (!user?.employee) {
    throw new AppError('Employee profile not found', 404);
  }

  return {
    id: user.employee.id,
    companyId: user.employee.companyId,
    userId: user.id,
    role: user.role,
  };
};

/**
 * Check if user is SUPER_ADMIN (for flat API list access and modifications)
 */
const requireSuperAdminPermissions = (role: string) => {
  if (role !== 'SUPER_ADMIN') {
    throw new AppError('Insufficient permissions. Super Admin access required.', 403);
  }
};

/**
 * Check if user can view individual calendar by ID (all authenticated users)
 */
const canViewCalendarById = (role: string): boolean => {
  return ['SUPER_ADMIN', 'ORG_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE'].includes(role);
};

/**
 * Check if user can view calendar lists (SUPER_ADMIN only for flat APIs)
 */
const canViewCalendarList = (role: string): boolean => {
  return role === 'SUPER_ADMIN';
};

/**
 * Validate calendar belongs to user's company
 */
const validateCalendarAccess = async (calendarId: string, companyId: string) => {
  const calendar = await prisma.calendar.findUnique({
    where: { id: calendarId },
  });

  if (!calendar) {
    throw new AppError('Calendar not found', 404);
  }

  if (calendar.companyId !== companyId) {
    throw new AppError('Access denied. Calendar belongs to different company.', 403);
  }

  return calendar;
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
    const employee = await getEmployeeContext(authContext.userId);

    // Only SUPER_ADMIN can view calendar lists via flat API
    if (!canViewCalendarList(authContext.role)) {
      return next(new AppError('Insufficient permissions. Use company-specific endpoints for calendar management.', 403));
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const name = (req.query.name as string) || undefined;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      companyId: employee.companyId,
    };

    if (name) {
      whereClause.name = {
        contains: name,
        mode: 'insensitive',
      };
    }

    const [calendars, total] = await Promise.all([
      prisma.calendar.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { employees: true },
          },
        },
      }),
      prisma.calendar.count({ where: whereClause }),
    ]);

    const response: CalendarsListResponseDto = {
      calendars: calendars.map((calendar) => ({
        id: calendar.id,
        companyId: calendar.companyId,
        name: calendar.name,
        dayStartTime: calendar.dayStartTime,
        dayEndTime: calendar.dayEndTime,
        employeeCount: calendar._count.employees,
      })),
      total,
    };

    sendResponse(res, 200, response, 'Calendars retrieved successfully');
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
    const employee = await getEmployeeContext(authContext.userId);
    const { calendarId } = req.params;

    // All authenticated users can view calendar details if they know the ID
    if (!canViewCalendarById(authContext.role)) {
      return next(new AppError('Insufficient permissions to view calendar details', 403));
    }

    const calendar = await validateCalendarAccess(calendarId, employee.companyId);

    const calendarWithDetails = await prisma.calendar.findUnique({
      where: { id: calendarId },
      include: {
        weeklyRules: {
          orderBy: { dayOfWeek: 'asc' },
        },
        holidays: {
          orderBy: { date: 'asc' },
        },
        _count: {
          select: { employees: true },
        },
      },
    });

    const response: CalendarDetailsResponseDto = {
      id: calendarWithDetails!.id,
      companyId: calendarWithDetails!.companyId,
      name: calendarWithDetails!.name,
      dayStartTime: calendarWithDetails!.dayStartTime,
      dayEndTime: calendarWithDetails!.dayEndTime,
      weeklyRules: calendarWithDetails!.weeklyRules.map((rule) => ({
        id: rule.id,
        calendarId: rule.calendarId,
        dayOfWeek: rule.dayOfWeek,
        type: rule.type,
        strategy: rule.strategy,
        interval: rule.interval || undefined,
        referenceDate: rule.referenceDate || undefined,
        positions: rule.positions.length > 0 ? rule.positions : undefined,
      })),
      holidays: calendarWithDetails!.holidays.map((holiday) => ({
        id: holiday.id,
        calendarId: holiday.calendarId,
        date: holiday.date,
        name: holiday.name,
        isOptional: holiday.isOptional,
      })),
      employeeCount: calendarWithDetails!._count.employees,
    };

    sendResponse(res, 200, response, 'Calendar details retrieved successfully');
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
    const employee = await getEmployeeContext(authContext.userId);
    requireSuperAdminPermissions(authContext.role);

    const createData: CreateCalendarRequestDto = req.body;

    // Check if calendar name already exists in company
    const existingCalendar = await prisma.calendar.findFirst({
      where: {
        companyId: employee.companyId,
        name: createData.name,
      },
    });

    if (existingCalendar) {
      return next(new AppError('Calendar with this name already exists', 400));
    }

    const calendar = await prisma.calendar.create({
      data: {
        companyId: employee.companyId,
        name: createData.name,
        dayStartTime: createData.dayStartTime,
        dayEndTime: createData.dayEndTime,
      },
    });

    const response: CalendarResponseDto = {
      id: calendar.id,
      companyId: calendar.companyId,
      name: calendar.name,
      dayStartTime: calendar.dayStartTime,
      dayEndTime: calendar.dayEndTime,
      employeeCount: 0,
    };

    sendResponse(res, 201, response, 'Calendar created successfully');
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
    const employee = await getEmployeeContext(authContext.userId);
    requireSuperAdminPermissions(authContext.role);

    const { calendarId } = req.params;
    const updateData: UpdateCalendarRequestDto = req.body;

    await validateCalendarAccess(calendarId, employee.companyId);

    // Check if new name conflicts
    if (updateData.name) {
      const existingCalendar = await prisma.calendar.findFirst({
        where: {
          companyId: employee.companyId,
          name: updateData.name,
          id: { not: calendarId },
        },
      });

      if (existingCalendar) {
        return next(new AppError('Calendar with this name already exists', 400));
      }
    }

    const updatedCalendar = await prisma.calendar.update({
      where: { id: calendarId },
      data: updateData,
      include: {
        _count: {
          select: { employees: true },
        },
      },
    });

    const response: CalendarResponseDto = {
      id: updatedCalendar.id,
      companyId: updatedCalendar.companyId,
      name: updatedCalendar.name,
      dayStartTime: updatedCalendar.dayStartTime,
      dayEndTime: updatedCalendar.dayEndTime,
      employeeCount: updatedCalendar._count.employees,
    };

    sendResponse(res, 200, response, 'Calendar updated successfully');
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
    const employee = await getEmployeeContext(authContext.userId);
    requireSuperAdminPermissions(authContext.role);

    const { calendarId } = req.params;

    await validateCalendarAccess(calendarId, employee.companyId);

    // Check if calendar is assigned to any employees
    const employeeCount = await prisma.employee.count({
      where: { calendarId },
    });

    if (employeeCount > 0) {
      return next(new AppError('Cannot delete calendar. It is assigned to employees.', 400));
    }

    await prisma.calendar.delete({
      where: { id: calendarId },
    });

    sendResponse(res, 200, { message: 'Calendar deleted successfully' }, 'Calendar deleted successfully');
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
    const employee = await getEmployeeContext(authContext.userId);
    const { calendarId } = req.params;

    // All authenticated users can view weekly rules if they know the calendar ID
    if (!canViewCalendarById(authContext.role)) {
      return next(new AppError('Insufficient permissions to view weekly rules', 403));
    }

    await validateCalendarAccess(calendarId, employee.companyId);

    const rules = await prisma.calendarWeeklyRule.findMany({
      where: { calendarId },
      orderBy: { dayOfWeek: 'asc' },
    });

    const response: WeeklyRulesListResponseDto = {
      rules: rules.map((rule) => ({
        id: rule.id,
        calendarId: rule.calendarId,
        dayOfWeek: rule.dayOfWeek,
        type: rule.type,
        strategy: rule.strategy,
        interval: rule.interval || undefined,
        referenceDate: rule.referenceDate || undefined,
        positions: rule.positions.length > 0 ? rule.positions : undefined,
      })),
      total: rules.length,
    };

    sendResponse(res, 200, response, 'Weekly rules retrieved successfully');
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
    const employee = await getEmployeeContext(authContext.userId);
    requireSuperAdminPermissions(authContext.role);

    const { calendarId } = req.params;
    const createData: CreateWeeklyRuleRequestDto = req.body;

    await validateCalendarAccess(calendarId, employee.companyId);

    // Check for duplicate day rules
    const existingRule = await prisma.calendarWeeklyRule.findFirst({
      where: {
        calendarId,
        dayOfWeek: createData.dayOfWeek,
      },
    });

    if (existingRule) {
      return next(new AppError(`Weekly rule for day ${createData.dayOfWeek} already exists`, 400));
    }

    const rule = await prisma.calendarWeeklyRule.create({
      data: {
        calendarId,
        dayOfWeek: createData.dayOfWeek,
        type: createData.type,
        strategy: createData.strategy,
        interval: createData.interval,
        referenceDate: createData.referenceDate ? new Date(createData.referenceDate) : undefined,
        positions: createData.positions || [],
      },
    });

    const response: WeeklyRuleResponseDto = {
      id: rule.id,
      calendarId: rule.calendarId,
      dayOfWeek: rule.dayOfWeek,
      type: rule.type,
      strategy: rule.strategy,
      interval: rule.interval || undefined,
      referenceDate: rule.referenceDate || undefined,
      positions: rule.positions.length > 0 ? rule.positions : undefined,
    };

    sendResponse(res, 201, response, 'Weekly rule created successfully');
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
    const employee = await getEmployeeContext(authContext.userId);
    requireSuperAdminPermissions(authContext.role);

    const { calendarId, ruleId } = req.params;
    const updateData: UpdateWeeklyRuleRequestDto = req.body;

    await validateCalendarAccess(calendarId, employee.companyId);

    const rule = await prisma.calendarWeeklyRule.findUnique({
      where: { id: ruleId },
    });

    if (!rule || rule.calendarId !== calendarId) {
      return next(new AppError('Weekly rule not found', 404));
    }

    // Check for duplicate day if updating dayOfWeek
    if (updateData.dayOfWeek !== undefined && updateData.dayOfWeek !== rule.dayOfWeek) {
      const existingRule = await prisma.calendarWeeklyRule.findFirst({
        where: {
          calendarId,
          dayOfWeek: updateData.dayOfWeek,
        },
      });

      if (existingRule) {
        return next(new AppError(`Weekly rule for day ${updateData.dayOfWeek} already exists`, 400));
      }
    }

    const updatedRule = await prisma.calendarWeeklyRule.update({
      where: { id: ruleId },
      data: {
        ...updateData,
        referenceDate: updateData.referenceDate ? new Date(updateData.referenceDate) : undefined,
      },
    });

    const response: WeeklyRuleResponseDto = {
      id: updatedRule.id,
      calendarId: updatedRule.calendarId,
      dayOfWeek: updatedRule.dayOfWeek,
      type: updatedRule.type,
      strategy: updatedRule.strategy,
      interval: updatedRule.interval || undefined,
      referenceDate: updatedRule.referenceDate || undefined,
      positions: updatedRule.positions.length > 0 ? updatedRule.positions : undefined,
    };

    sendResponse(res, 200, response, 'Weekly rule updated successfully');
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
    const employee = await getEmployeeContext(authContext.userId);
    requireSuperAdminPermissions(authContext.role);

    const { calendarId, ruleId } = req.params;

    await validateCalendarAccess(calendarId, employee.companyId);

    const rule = await prisma.calendarWeeklyRule.findUnique({
      where: { id: ruleId },
    });

    if (!rule || rule.calendarId !== calendarId) {
      return next(new AppError('Weekly rule not found', 404));
    }

    await prisma.calendarWeeklyRule.delete({
      where: { id: ruleId },
    });

    sendResponse(res, 200, { message: 'Weekly rule deleted successfully' }, 'Weekly rule deleted successfully');
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
    const employee = await getEmployeeContext(authContext.userId);
    const { calendarId } = req.params;

    // All authenticated users can view holidays if they know the calendar ID
    if (!canViewCalendarById(authContext.role)) {
      return next(new AppError('Insufficient permissions to view holidays', 403));
    }

    await validateCalendarAccess(calendarId, employee.companyId);

    const year = parseInt(req.query.year as string) || new Date().getFullYear();

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const holidays = await prisma.calendarHoliday.findMany({
      where: {
        calendarId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    const response: HolidaysListResponseDto = {
      holidays: holidays.map((holiday) => ({
        id: holiday.id,
        calendarId: holiday.calendarId,
        date: holiday.date,
        name: holiday.name,
        isOptional: holiday.isOptional,
      })),
      total: holidays.length,
    };

    sendResponse(res, 200, response, 'Holidays retrieved successfully');
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
    const employee = await getEmployeeContext(authContext.userId);
    requireSuperAdminPermissions(authContext.role);

    const { calendarId } = req.params;
    const createData: CreateHolidayRequestDto = req.body;

    await validateCalendarAccess(calendarId, employee.companyId);

    const holidayDate = new Date(createData.date);
    holidayDate.setHours(0, 0, 0, 0);

    // Check for duplicate holiday on same date
    const existingHoliday = await prisma.calendarHoliday.findUnique({
      where: {
        calendarId_date: {
          calendarId,
          date: holidayDate,
        },
      },
    });

    if (existingHoliday) {
      return next(new AppError('Holiday already exists on this date', 400));
    }

    const holiday = await prisma.calendarHoliday.create({
      data: {
        calendarId,
        date: holidayDate,
        name: createData.name,
        isOptional: createData.isOptional || false,
      },
    });

    const response: HolidayResponseDto = {
      id: holiday.id,
      calendarId: holiday.calendarId,
      date: holiday.date,
      name: holiday.name,
      isOptional: holiday.isOptional,
    };

    sendResponse(res, 201, response, 'Holiday created successfully');
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
    const employee = await getEmployeeContext(authContext.userId);
    requireSuperAdminPermissions(authContext.role);

    const { calendarId, holidayId } = req.params;
    const updateData: UpdateHolidayRequestDto = req.body;

    await validateCalendarAccess(calendarId, employee.companyId);

    const holiday = await prisma.calendarHoliday.findUnique({
      where: { id: holidayId },
    });

    if (!holiday || holiday.calendarId !== calendarId) {
      return next(new AppError('Holiday not found', 404));
    }

    const updatedHoliday = await prisma.calendarHoliday.update({
      where: { id: holidayId },
      data: updateData,
    });

    const response: HolidayResponseDto = {
      id: updatedHoliday.id,
      calendarId: updatedHoliday.calendarId,
      date: updatedHoliday.date,
      name: updatedHoliday.name,
      isOptional: updatedHoliday.isOptional,
    };

    sendResponse(res, 200, response, 'Holiday updated successfully');
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
    const employee = await getEmployeeContext(authContext.userId);
    requireSuperAdminPermissions(authContext.role);

    const { calendarId, holidayId } = req.params;

    await validateCalendarAccess(calendarId, employee.companyId);

    const holiday = await prisma.calendarHoliday.findUnique({
      where: { id: holidayId },
    });

    if (!holiday || holiday.calendarId !== calendarId) {
      return next(new AppError('Holiday not found', 404));
    }

    await prisma.calendarHoliday.delete({
      where: { id: holidayId },
    });

    sendResponse(res, 200, { message: 'Holiday deleted successfully' }, 'Holiday deleted successfully');
  }
);