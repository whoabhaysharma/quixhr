import { Router } from 'express';
import { Role } from '@prisma/client';
import { protect, restrictTo } from '@/shared/middleware';
import validate from '@/shared/middleware/validate-resource.middleware';
import * as CalendarController from './calendars.controller';
import {
    updateCalendarSchema,
    createWeeklyRuleSchema,
    updateWeeklyRuleSchema,
    createHolidaySchema,
    updateHolidaySchema,
    calendarQuerySchema,
    holidayQuerySchema,
} from './calendars.schema';

const router = Router();
router.use(protect);

// =========================================================================
// 1. GLOBAL LIST (Super Admin / Cross-Company)
// =========================================================================

/**
 * @route   GET /api/v1/calendars
 * @desc    Get all calendars (Super Admin view)
 */
router.get(
    '/',
    restrictTo(Role.SUPER_ADMIN),
    validate(calendarQuerySchema),
    CalendarController.getCalendars
);

// =========================================================================
// 2. SUB-RESOURCES: WEEKLY RULES (Shallow Management)
// =========================================================================
// NOTE: We define these BEFORE the generic /:calendarId to avoid collisions.

// --- Management (Using unique Rule ID) ---
// PATCH /api/v1/calendars/weekly-rules/:ruleId
router.patch(
    '/weekly-rules/:ruleId',
    restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER),
    validate(updateWeeklyRuleSchema),
    CalendarController.updateWeeklyRule
);

// DELETE /api/v1/calendars/weekly-rules/:ruleId
router.delete(
    '/weekly-rules/:ruleId',
    restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER),
    CalendarController.deleteWeeklyRule
);

// --- Holidays Management (Using unique Holiday ID) ---
// PATCH /api/v1/calendars/holidays/:holidayId
router.patch(
    '/holidays/:holidayId',
    restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER),
    validate(updateHolidaySchema),
    CalendarController.updateHoliday
);

// DELETE /api/v1/calendars/holidays/:holidayId
router.delete(
    '/holidays/:holidayId',
    restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER),
    CalendarController.deleteHoliday
);

// =========================================================================
// 3. SINGLE CALENDAR & DEEP NESTED LISTS
// =========================================================================

// --- Get/Update/Delete Calendar ---
// URL: /api/v1/calendars/:calendarId
router.get(
    '/:calendarId',
    restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER),
    CalendarController.getCalendarById
);

router.patch(
    '/:calendarId',
    restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER),
    validate(updateCalendarSchema),
    CalendarController.updateCalendar
);

router.delete(
    '/:calendarId',
    restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER),
    CalendarController.deleteCalendar
);

// --- Sub-Resource Lists & Creation (Requires Calendar Context) ---

// Weekly Rules
// GET /api/v1/calendars/:calendarId/weekly-rules
router.get(
    '/:calendarId/weekly-rules',
    restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER),
    CalendarController.getWeeklyRules
);

// POST /api/v1/calendars/:calendarId/weekly-rules
router.post(
    '/:calendarId/weekly-rules',
    restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN), // Usually Admins only
    validate(createWeeklyRuleSchema),
    CalendarController.createWeeklyRule
);

// Holidays
// GET /api/v1/calendars/:calendarId/holidays
router.get(
    '/:calendarId/holidays',
    restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER),
    validate(holidayQuerySchema),
    CalendarController.getHolidays
);

// POST /api/v1/calendars/:calendarId/holidays
router.post(
    '/:calendarId/holidays',
    restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN),
    validate(createHolidaySchema),
    CalendarController.createHoliday
);

export default router;