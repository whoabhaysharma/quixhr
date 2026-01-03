import { Router } from 'express';
import { Role } from '@prisma/client';
import { protect, resolveTenant, restrictTo, validate } from '@/shared/middleware';
import * as CalendarController from './calendars.controller';
import {
    createCalendarSchema,
    updateCalendarSchema,
    getCalendarsQuerySchema,
    calendarIdSchema,
    createWeeklyRuleSchema,
    updateWeeklyRuleSchema,
    weeklyRuleIdSchema,
    createHolidaySchema,
    updateHolidaySchema,
    getHolidaysQuerySchema,
    holidayIdSchema
} from './calendars.schema';

const router = Router();

// Global Middleware
router.use(protect);
router.use(resolveTenant);

// =========================================================================
// CALENDAR ROUTES
// =========================================================================

/**
 * @route   GET /api/v1/calendars
 * @desc    Get all calendars
 * @access  ORG_ADMIN, HR_ADMIN, SUPER_ADMIN
 */
router.get(
    '/',
    restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.SUPER_ADMIN),
    validate(getCalendarsQuerySchema),
    CalendarController.getCalendars
);

/**
 * @route   POST /api/v1/calendars
 * @desc    Create a new calendar
 * @access  ORG_ADMIN, HR_ADMIN, SUPER_ADMIN
 */
router.post(
    '/',
    restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.SUPER_ADMIN),
    validate(createCalendarSchema),
    CalendarController.createCalendar
);

/**
 * @route   GET /api/v1/calendars/:id
 * @desc    Get calendar details
 * @access  ORG_ADMIN, HR_ADMIN, SUPER_ADMIN
 */
router.get(
    '/:id',
    restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.SUPER_ADMIN),
    validate(calendarIdSchema),
    CalendarController.getCalendarById
);

/**
 * @route   PATCH /api/v1/calendars/:id
 * @desc    Update calendar
 * @access  ORG_ADMIN, HR_ADMIN, SUPER_ADMIN
 */
router.patch(
    '/:id',
    restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.SUPER_ADMIN),
    validate(updateCalendarSchema),
    CalendarController.updateCalendar
);

/**
 * @route   DELETE /api/v1/calendars/:id
 * @desc    Delete calendar
 * @access  ORG_ADMIN, HR_ADMIN, SUPER_ADMIN
 */
router.delete(
    '/:id',
    restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.SUPER_ADMIN),
    validate(calendarIdSchema),
    CalendarController.deleteCalendar
);

// =========================================================================
// WEEKLY RULE ROUTES (Nested under /:calendarId/weekly-rules)
// =========================================================================

// Note: Using :calendarId param, but express Router mergeParams might be needed if this was separate router.
// Since it's one file, we just define the paths.

router.get(
    '/:calendarId/weekly-rules',
    restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.SUPER_ADMIN),
    // Validate that calendarId is UUID? createWeeklyRuleSchema params handles it?
    // We should ideally have a schema for just calendarId param here. 
    // We can reuse calendarIdSchema if we rename param in check or use explicit object.
    // Let's rely on createWeeklyRuleSchema's param part if getting strictly, or just generic check.
    // Actually, validate middleware accepts { params: ... }.
    // Let's use customized inline schema or reuse generic ones.
    // createWeeklyRuleSchema has params: { calendarId }
    validate({ params: createWeeklyRuleSchema.params }),
    CalendarController.getWeeklyRules
);

router.post(
    '/:calendarId/weekly-rules',
    restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.SUPER_ADMIN),
    validate(createWeeklyRuleSchema),
    CalendarController.createWeeklyRule
);

router.patch(
    '/weekly-rules/:ruleId',
    restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.SUPER_ADMIN),
    validate(updateWeeklyRuleSchema),
    CalendarController.updateWeeklyRule
);

router.delete(
    '/weekly-rules/:ruleId',
    restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.SUPER_ADMIN),
    validate(weeklyRuleIdSchema),
    CalendarController.deleteWeeklyRule
);

// =========================================================================
// HOLIDAY ROUTES (Nested under /:calendarId/holidays)
// =========================================================================

router.get(
    '/:calendarId/holidays',
    restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.SUPER_ADMIN),
    validate(getHolidaysQuerySchema),
    CalendarController.getHolidays
);

router.post(
    '/:calendarId/holidays',
    restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.SUPER_ADMIN),
    validate(createHolidaySchema),
    CalendarController.createHoliday
);

router.patch(
    '/holidays/:holidayId',
    restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.SUPER_ADMIN),
    validate(updateHolidaySchema),
    CalendarController.updateHoliday
);

router.delete(
    '/holidays/:holidayId',
    restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.SUPER_ADMIN),
    validate(holidayIdSchema),
    CalendarController.deleteHoliday
);

export default router;