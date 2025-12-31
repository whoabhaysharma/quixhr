import { Router } from 'express';
import { Role } from '@prisma/client';
import * as CompanyController from './company.controller';
import { updateCompanySchema } from './company.schema';

// Import Sub-Routers for "Nested Creation/Listing"
import employeeRoutes from '@/modules/employee/employee.routes';
import calendarRoutes from '@/modules/calendar/calendar.routes';
import leaveRoutes from '@/modules/leave/leave.routes';
import invitationRoutes from '@/modules/invitation/invitation.routes';
import leaveGradeRoutes from '@/modules/leave-grade/leave-grade.routes';
import { protect, resolveTenant, restrictTo, validate } from '@/shared/middleware';

const router = Router();

// =========================================================================
// 1. GLOBAL MIDDLEWARE
// =========================================================================
// All routes here require login
router.use(protect);

// =========================================================================
// 2. MOUNT SUB-ROUTERS (The "Nested" Strategy)
// =========================================================================
// This enables URLs like: POST /api/v1/companies/:companyId/employees
// The 'resolveTenant' middleware ensures the user actually belongs to :companyId

router.use('/:companyId/employees', resolveTenant, employeeRoutes);
router.use('/:companyId/calendars', resolveTenant, calendarRoutes);
router.use('/:companyId/invitations', resolveTenant, invitationRoutes);

// Leave Routes (For Admin Inbox / Reports context)
router.use('/:companyId/leaves', resolveTenant, leaveRoutes);

// Leave Grades (Policies)
router.use('/:companyId/leave-grades', resolveTenant, leaveGradeRoutes);


// =========================================================================
// 3. COMPANY MANAGEMENT (Admin Only)
// =========================================================================

/**
 * @route   GET /api/v1/companies/:companyId
 * @desc    Get company details (Name, Timezone, Plan status)
 * @access  ORG_ADMIN, HR_ADMIN, SUPER_ADMIN
 */
router.get(
  '/:companyId',
  resolveTenant,
  restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.SUPER_ADMIN),
  CompanyController.getCompany
);

/**
 * @route   PATCH /api/v1/companies/:companyId
 * @desc    Update settings (Timezone, Currency, Logo)
 * @access  ORG_ADMIN, SUPER_ADMIN (HR usually cannot change these)
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
 * @desc    Get Admin Dashboard Stats (Headcount, Absent today, Pending Leaves)
 * @access  ORG_ADMIN, HR_ADMIN, SUPER_ADMIN
 */
router.get(
  '/:companyId/dashboard',
  resolveTenant,
  restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.SUPER_ADMIN),
  CompanyController.getDashboardStats
);

/**
 * @route   GET /api/v1/companies/:companyId/audit-logs
 * @desc    Get all audit logs for this company (Compliance)
 * @access  ORG_ADMIN, SUPER_ADMIN
 */
router.get(
  '/:companyId/audit-logs',
  resolveTenant,
  restrictTo(Role.ORG_ADMIN, Role.SUPER_ADMIN),
  CompanyController.getCompanyAuditLogs
);

// =========================================================================
// 4. BILLING & PLANS (Sensitive)
// =========================================================================

/**
 * @route   POST /api/v1/companies/:companyId/billing/upgrade
 * @desc    Initiate a Plan Upgrade (e.g. generate Razorpay Order)
 * @access  ORG_ADMIN, SUPER_ADMIN
 */
router.post(
  '/:companyId/billing/upgrade',
  resolveTenant,
  restrictTo(Role.ORG_ADMIN, Role.SUPER_ADMIN),
  CompanyController.initiateUpgrade
);

/**
 * @route   GET /api/v1/companies/:companyId/billing/invoices
 * @desc    Get payment history
 * @access  ORG_ADMIN, SUPER_ADMIN
 */
router.get(
  '/:companyId/billing/invoices',
  resolveTenant,
  restrictTo(Role.ORG_ADMIN, Role.SUPER_ADMIN),
  CompanyController.getBillingHistory
);

export default router;