import { Router } from 'express';
import { Role } from '@prisma/client';
import * as CompanyController from './company.controller';
import { updateCompanySchema, auditLogQuerySchema } from './company.schema';

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

// POST /api/v1/companies/:companyId/employees
router.post(
    '/:companyId/employees',
    resolveTenant,
    restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.SUPER_ADMIN),
    validate(createEmployeeSchema),
    EmployeeController.createEmployee
);

// --- Calendars (Nested Create) ---
// POST /api/v1/companies/:companyId/calendars
router.post(
    '/:companyId/calendars',
    resolveTenant,
    restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.SUPER_ADMIN),
    validate(createCalendarSchema),
    CalendarController.createCalendar
);

// --- Leave Grades (Nested Create) ---
// POST /api/v1/companies/:companyId/leave-grades
router.post(
    '/:companyId/leave-grades',
    resolveTenant,
    restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.SUPER_ADMIN),
    validate(createLeaveGradeSchema),
    LeaveController.createLeaveGrade
);

// --- Invitations (Nested Create) ---
import * as InvitationController from '../invitations/invitations.controller';
import { createInvitationSchema } from '../invitations/invitations.schema';

// POST /api/v1/companies/:companyId/invitations
router.post(
    '/:companyId/invitations',
    resolveTenant,
    restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.SUPER_ADMIN),
    validate(createInvitationSchema),
    InvitationController.createInvitation
);



// =========================================================================
// 2. COMPANY MANAGEMENT ROUTES
// =========================================================================

/**
 * @route   GET /api/v1/companies/:companyId
 */
router.get(
    '/:companyId',
    resolveTenant,
    restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.SUPER_ADMIN),
    CompanyController.getCompany
);

/**
 * @route   GET /api/v1/companies
 */
router.get(
    '/',
    resolveTenant,
    restrictTo(Role.SUPER_ADMIN),
    CompanyController.getCompanies
);

/**
 * @route   POST /api/v1/companies
 */
router.post(
    '/',
    resolveTenant,
    restrictTo(Role.SUPER_ADMIN),
    CompanyController.createCompany
);

/**
 * @route   PATCH /api/v1/companies/:companyId
 */
router.patch(
    '/:companyId',
    resolveTenant,
    restrictTo(Role.ORG_ADMIN, Role.SUPER_ADMIN),
    validate(updateCompanySchema),
    CompanyController.updateCompany
);

/**
 * @route   GET /api/v1/companies/:companyId/dashboard
 */
router.get(
    '/:companyId/dashboard',
    resolveTenant,
    restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.SUPER_ADMIN),
    CompanyController.getDashboardStats
);

/**
 * @route   GET /api/v1/companies/:companyId/audit-logs
 */
router.get(
    '/:companyId/audit-logs',
    resolveTenant,
    restrictTo(Role.ORG_ADMIN, Role.SUPER_ADMIN),
    validate(auditLogQuerySchema),
    CompanyController.getCompanyAuditLogs
);

// =========================================================================
// 3. BILLING & PLANS
// =========================================================================
/*
router.post(
    '/:companyId/billing/upgrade',
    resolveTenant,
    restrictTo(Role.ORG_ADMIN, Role.SUPER_ADMIN),
    CompanyController.initiateUpgrade
);

router.get(
    '/:companyId/billing/invoices',
    resolveTenant,
    restrictTo(Role.ORG_ADMIN, Role.SUPER_ADMIN),
    CompanyController.getBillingHistory
);
*/

export default router;