import { Router } from 'express';
import * as CalendarController from './calendar.controller';
import * as CalendarSchema from './calendar.schema';
import { protect, restrictTo } from '@/modules/auth/auth.middleware';
import { resolveTenant } from '@/shared/middleware/tenantContext';
import validate from '@/shared/middleware/validateResource';
import { Role } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(protect);

/**
 * @route   GET /api/v1/calendars/check-date
 * @desc    Utility to test "Is this date working/off?"
 * @access  System/All authenticated users
 * @note    This route MUST be defined BEFORE /:id routes to avoid conflicts
 */
router.get(
    '/check-date',
    validate(CalendarSchema.checkDateSchema),
    CalendarController.checkDate
);

// Routes below require tenant resolution
router.use(resolveTenant);

/**
 * @route   GET /api/v1/calendars
 * @desc    List all shifts (General, Night, US Shift)
 * @access  HR Admin
 */
router.get(
    '/',
    restrictTo(Role.HR_ADMIN, Role.ORG_ADMIN, Role.SUPER_ADMIN),
    validate(CalendarSchema.listCalendarsSchema),
    CalendarController.listCalendars
);

/**
 * @route   POST /api/v1/calendars
 * @desc    Create a new Shift/Calendar
 * @access  HR Admin
 */
router.post(
    '/',
    restrictTo(Role.HR_ADMIN, Role.ORG_ADMIN, Role.SUPER_ADMIN),
    validate(CalendarSchema.createCalendarSchema),
    CalendarController.createCalendar
);

/**
 * @route   PATCH /api/v1/calendars/:id
 * @desc    Update timings (Start/End time)
 * @access  HR Admin
 */
router.patch(
    '/:id',
    restrictTo(Role.HR_ADMIN, Role.ORG_ADMIN, Role.SUPER_ADMIN),
    validate(CalendarSchema.updateCalendarSchema),
    CalendarController.updateCalendar
);

/**
 * @route   PUT /api/v1/calendars/:id/weekly-rules
 * @desc    Set the complex rules (Alt Sat, etc)
 * @access  HR Admin
 */
router.put(
    '/:id/weekly-rules',
    restrictTo(Role.HR_ADMIN, Role.ORG_ADMIN, Role.SUPER_ADMIN),
    validate(CalendarSchema.setWeeklyRulesSchema),
    CalendarController.setWeeklyRules
);

/**
 * @route   GET /api/v1/calendars/:id/holidays
 * @desc    Get holiday list for a specific calendar
 * @access  All authenticated users
 */
router.get(
    '/:id/holidays',
    validate(CalendarSchema.getHolidaysSchema),
    CalendarController.getHolidays
);

/**
 * @route   POST /api/v1/calendars/:id/holidays
 * @desc    Add a holiday (or bulk upload)
 * @access  HR Admin
 * @note    Accepts both single holiday and bulk upload with 'holidays' array
 */
router.post(
    '/:id/holidays',
    restrictTo(Role.HR_ADMIN, Role.ORG_ADMIN, Role.SUPER_ADMIN),
    validate(CalendarSchema.createHolidaySchema),
    CalendarController.createHolidays
);

/**
 * @route   DELETE /api/v1/calendars/:id/holidays/:hid
 * @desc    Remove a holiday
 * @access  HR Admin
 */
router.delete(
    '/:id/holidays/:hid',
    restrictTo(Role.HR_ADMIN, Role.ORG_ADMIN, Role.SUPER_ADMIN),
    validate(CalendarSchema.deleteHolidaySchema),
    CalendarController.deleteHoliday
);

export default router;
