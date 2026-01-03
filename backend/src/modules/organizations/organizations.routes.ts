import { Router } from 'express';
import { Role } from '@prisma/client';
import * as OrganizationController from './organization.controller';
import { updateOrganizationSchema, auditLogQuerySchema } from './organization.schema';

// --- Cross-Module Imports ---
import * as CalendarController from '../calendars/calendars.controller';
import { createCalendarSchema, calendarQuerySchema } from '../calendars/calendars.schema';

import * as LeaveController from '../leaves/leaves.controller';
import { createLeaveGradeSchema } from '../leaves/leaves.schema';

import { protect, resolveTenant, restrictTo, validate } from '@/shared/middleware';

const router = Router();

// Global Middleware
router.use(protect);

// =========================================================================
// 1. NESTED RESOURCE ENTRY POINTS (Creation Only)
// =========================================================================

// --- Employees (Nested Create) ---
import * as EmployeeController from '../employees/employees.controller';
import { createEmployeeSchema } from '../employees/employees.schema';

// POST /api/v1/org/:organizationId/employees
router.post(
    '/:organizationId/employees',
    resolveTenant,
    restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.SUPER_ADMIN),
    validate(createEmployeeSchema),
    EmployeeController.createEmployee
);

// --- Calendars (Nested Create) ---
// POST /api/v1/org/:organizationId/calendars
router.post(
    '/:organizationId/calendars',
    resolveTenant,
    restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.SUPER_ADMIN),
    validate(createCalendarSchema),
    CalendarController.createCalendar
);

// --- Leave Grades (Nested Create) ---
// POST /api/v1/org/:organizationId/leave-grades
router.post(
    '/:organizationId/leave-grades',
    resolveTenant,
    restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.SUPER_ADMIN),
    validate(createLeaveGradeSchema),
    LeaveController.createLeaveGrade
);

// --- Invitations (Nested Create) ---
import * as InvitationController from '../invitations/invitations.controller';
import { createInvitationSchema } from '../invitations/invitations.schema';

// POST /api/v1/org/:organizationId/invitations
router.post(
    '/:organizationId/invitations',
    resolveTenant,
    restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.SUPER_ADMIN),
    validate(createInvitationSchema),
    InvitationController.createInvitation
);



// =========================================================================
// 2. ORGANIZATION MANAGEMENT ROUTES
// =========================================================================

/**
 * @route   GET /api/v1/org/:organizationId
 */
router.get(
    '/:organizationId',
    resolveTenant,
    restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.SUPER_ADMIN),
    OrganizationController.getOrganization
);

/**
 * @route   GET /api/v1/org
 */
router.get(
    '/',
    resolveTenant,
    restrictTo(Role.SUPER_ADMIN),
    OrganizationController.getOrganizations
);

/**
 * @route   POST /api/v1/org
 */
router.post(
    '/',
    resolveTenant,
    restrictTo(Role.SUPER_ADMIN),
    OrganizationController.createOrganization
);

/**
 * @route   PATCH /api/v1/org/:organizationId
 */
router.patch(
    '/:organizationId',
    resolveTenant,
    restrictTo(Role.ORG_ADMIN, Role.SUPER_ADMIN),
    validate(updateOrganizationSchema),
    OrganizationController.updateOrganization
);

/**
 * @route   GET /api/v1/org/:organizationId/dashboard
 */
router.get(
    '/:organizationId/dashboard',
    resolveTenant,
    restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.SUPER_ADMIN),
    OrganizationController.getDashboardStats
);

/**
 * @route   GET /api/v1/org/:organizationId/audit-logs
 */
router.get(
    '/:organizationId/audit-logs',
    resolveTenant,
    restrictTo(Role.ORG_ADMIN, Role.SUPER_ADMIN),
    validate(auditLogQuerySchema),
    OrganizationController.getOrganizationAuditLogs
);

// =========================================================================
// 3. BILLING & PLANS
// =========================================================================
/*
router.post(
    '/:organizationId/billing/upgrade',
    resolveTenant,
    restrictTo(Role.ORG_ADMIN, Role.SUPER_ADMIN),
    OrganizationController.initiateUpgrade
);

router.get(
    '/:organizationId/billing/invoices',
    resolveTenant,
    restrictTo(Role.ORG_ADMIN, Role.SUPER_ADMIN),
    OrganizationController.getBillingHistory
);
*/

export default router;