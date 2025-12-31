import { Router } from 'express';
import { Role } from '@prisma/client';
import { protect, restrictTo } from '@/shared/middleware';
import validate from '@/shared/middleware/validate-resource.middleware';
import {
  getCalendars,
  getCalendarById,
  createCalendar,
  updateCalendar,
  deleteCalendar,
  getWeeklyRules,
  createWeeklyRule,
  updateWeeklyRule,
  deleteWeeklyRule,
  getHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
} from './calendars.controller';
import {
  createCalendarSchema,
  updateCalendarSchema,
  createWeeklyRuleSchema,
  updateWeeklyRuleSchema,
  createHolidaySchema,
  updateHolidaySchema,
  calendarQuerySchema,
  holidayQuerySchema,
} from './calendars.schema';

const router = Router();

// Apply authentication middleware to all routes
router.use(protect);

// =========================================================================
// CALENDAR ROUTES (Tenant-Scoped Authorization)
// =========================================================================

/**
 * @route   GET /api/v1/calendars
 * @desc    Get all calendars for user's company
 * @access  SUPER_ADMIN only
 * @query   ?page=1&limit=20&name=searchTerm
 */
router.get(
  '/', 
  restrictTo(Role.SUPER_ADMIN), 
  validate(calendarQuerySchema), 
  getCalendars
);

/**
 * @route   GET /api/v1/calendars/:calendarId
 * @desc    Get calendar details by ID
 * @access  All authenticated users (scoped to company)
 */
router.get('/:calendarId', getCalendarById);

/**
 * @route   POST /api/v1/calendars
 * @desc    Create a new calendar
 * @access  SUPER_ADMIN only
 */
router.post(
  '/', 
  restrictTo(Role.SUPER_ADMIN), 
  validate(createCalendarSchema), 
  createCalendar
);

/**
 * @route   PATCH /api/v1/calendars/:calendarId
 * @desc    Update calendar
 * @access  SUPER_ADMIN only
 */
router.patch(
  '/:calendarId', 
  restrictTo(Role.SUPER_ADMIN), 
  validate(updateCalendarSchema), 
  updateCalendar
);

/**
 * @route   DELETE /api/v1/calendars/:calendarId
 * @desc    Delete calendar
 * @access  SUPER_ADMIN only
 */
router.delete(
  '/:calendarId', 
  restrictTo(Role.SUPER_ADMIN), 
  deleteCalendar
);

// =========================================================================
// WEEKLY RULES ROUTES (Tenant-Scoped Authorization)
// =========================================================================

/**
 * @route   GET /api/v1/calendars/:calendarId/weekly-rules
 * @desc    Get all weekly rules for a calendar
 * @access  All authenticated users (scoped to company)
 */
router.get('/:calendarId/weekly-rules', getWeeklyRules);

/**
 * @route   POST /api/v1/calendars/:calendarId/weekly-rules
 * @desc    Create a new weekly rule for calendar
 * @access  SUPER_ADMIN only
 */
router.post(
  '/:calendarId/weekly-rules', 
  restrictTo(Role.SUPER_ADMIN), 
  validate(createWeeklyRuleSchema), 
  createWeeklyRule
);

/**
 * @route   PATCH /api/v1/calendars/:calendarId/weekly-rules/:ruleId
 * @desc    Update a weekly rule
 * @access  SUPER_ADMIN only
 */
router.patch(
  '/:calendarId/weekly-rules/:ruleId', 
  restrictTo(Role.SUPER_ADMIN), 
  validate(updateWeeklyRuleSchema), 
  updateWeeklyRule
);

/**
 * @route   DELETE /api/v1/calendars/:calendarId/weekly-rules/:ruleId
 * @desc    Delete a weekly rule
 * @access  SUPER_ADMIN only
 */
router.delete(
  '/:calendarId/weekly-rules/:ruleId', 
  restrictTo(Role.SUPER_ADMIN), 
  deleteWeeklyRule
);

// =========================================================================
// HOLIDAY ROUTES (Tenant-Scoped Authorization)
// =========================================================================

/**
 * @route   GET /api/v1/calendars/:calendarId/holidays
 * @desc    Get all holidays for a calendar
 * @access  All authenticated users (scoped to company)
 * @query   ?year=2025
 */
router.get(
  '/:calendarId/holidays', 
  validate(holidayQuerySchema), 
  getHolidays
);

/**
 * @route   POST /api/v1/calendars/:calendarId/holidays
 * @desc    Create a new holiday for calendar
 * @access  SUPER_ADMIN only
 */
router.post(
  '/:calendarId/holidays', 
  restrictTo(Role.SUPER_ADMIN), 
  validate(createHolidaySchema), 
  createHoliday
);

/**
 * @route   PATCH /api/v1/calendars/:calendarId/holidays/:holidayId
 * @desc    Update a holiday
 * @access  SUPER_ADMIN only
 */
router.patch(
  '/:calendarId/holidays/:holidayId', 
  restrictTo(Role.SUPER_ADMIN), 
  validate(updateHolidaySchema), 
  updateHoliday
);

/**
 * @route   DELETE /api/v1/calendars/:calendarId/holidays/:holidayId
 * @desc    Delete a holiday
 * @access  SUPER_ADMIN only
 */
router.delete(
  '/:calendarId/holidays/:holidayId', 
  restrictTo(Role.SUPER_ADMIN), 
  deleteHoliday
);

export default router;
