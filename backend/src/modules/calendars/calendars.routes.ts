import { Router } from 'express';
import { protect } from '@/shared/middleware/auth.middleware';
import validate from '@/common/middlewares/validate.middleware';
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
 * @access  Protected (SUPER_ADMIN only)
 * @query   ?page=1&limit=20&name=searchTerm
 */
router.get('/', getCalendars);

/**
 * @route   GET /api/v1/calendars/:calendarId
 * @desc    Get calendar details by ID
 * @access  Protected (All authenticated users if they know ID, scoped to company)
 */
router.get('/:calendarId', getCalendarById);

/**
 * @route   POST /api/v1/calendars
 * @desc    Create a new calendar
 * @access  Protected (SUPER_ADMIN only) - Use nested API for tenant-scoped creation
 */
router.post('/', validate(createCalendarSchema), createCalendar);

/**
 * @route   PATCH /api/v1/calendars/:calendarId
 * @desc    Update calendar
 * @access  Protected (SUPER_ADMIN only) - Use nested API for tenant-scoped updates
 */
router.patch('/:calendarId', validate(updateCalendarSchema), updateCalendar);

/**
 * @route   DELETE /api/v1/calendars/:calendarId
 * @desc    Delete calendar
 * @access  Protected (SUPER_ADMIN only) - Use nested API for tenant-scoped deletions
 */
router.delete('/:calendarId', deleteCalendar);

// =========================================================================
// WEEKLY RULES ROUTES (Tenant-Scoped Authorization)
// =========================================================================

/**
 * @route   GET /api/v1/calendars/:calendarId/weekly-rules
 * @desc    Get all weekly rules for a calendar
 * @access  Protected (All authenticated users if they know calendar ID, scoped to company)
 */
router.get('/:calendarId/weekly-rules', getWeeklyRules);

/**
 * @route   POST /api/v1/calendars/:calendarId/weekly-rules
 * @desc    Create a new weekly rule for calendar
 * @access  Protected (SUPER_ADMIN only) - Use nested API for tenant-scoped creation
 */
router.post('/:calendarId/weekly-rules', validate(createWeeklyRuleSchema), createWeeklyRule);

/**
 * @route   PATCH /api/v1/calendars/:calendarId/weekly-rules/:ruleId
 * @desc    Update a weekly rule
 * @access  Protected (SUPER_ADMIN only) - Use nested API for tenant-scoped updates
 */
router.patch('/:calendarId/weekly-rules/:ruleId', validate(updateWeeklyRuleSchema), updateWeeklyRule);

/**
 * @route   DELETE /api/v1/calendars/:calendarId/weekly-rules/:ruleId
 * @desc    Delete a weekly rule
 * @access  Protected (SUPER_ADMIN only) - Use nested API for tenant-scoped deletions
 */
router.delete('/:calendarId/weekly-rules/:ruleId', deleteWeeklyRule);

// =========================================================================
// HOLIDAY ROUTES (Tenant-Scoped Authorization)
// =========================================================================

/**
 * @route   GET /api/v1/calendars/:calendarId/holidays
 * @desc    Get all holidays for a calendar
 * @access  Protected (All authenticated users if they know calendar ID, scoped to company)
 * @query   ?year=2025
 */
router.get('/:calendarId/holidays', getHolidays);

/**
 * @route   POST /api/v1/calendars/:calendarId/holidays
 * @desc    Create a new holiday for calendar
 * @access  Protected (SUPER_ADMIN only) - Use nested API for tenant-scoped creation
 */
router.post('/:calendarId/holidays', validate(createHolidaySchema), createHoliday);

/**
 * @route   PATCH /api/v1/calendars/:calendarId/holidays/:holidayId
 * @desc    Update a holiday
 * @access  Protected (SUPER_ADMIN only) - Use nested API for tenant-scoped updates
 */
router.patch('/:calendarId/holidays/:holidayId', validate(updateHolidaySchema), updateHoliday);

/**
 * @route   DELETE /api/v1/calendars/:calendarId/holidays/:holidayId
 * @desc    Delete a holiday
 * @access  Protected (SUPER_ADMIN only) - Use nested API for tenant-scoped deletions
 */
router.delete('/:calendarId/holidays/:holidayId', deleteHoliday);

export default router;
