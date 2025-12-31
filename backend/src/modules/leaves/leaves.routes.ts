import { Router } from 'express';
import { Role } from '@prisma/client';
import * as LeaveController from './leaves.controller';
import {
  createLeaveRequestSchema,
  updateLeaveRequestSchema,
  getLeaveRequestSchema,
  getLeaveRequestsSchema,
  getLeaveBalancesSchema,
  adjustLeaveBalanceSchema,
} from './leaves.schema';
import { restrictTo, validate } from '@/shared/middleware';

const router = Router();

// =========================================================================
// LEAVE REQUEST ROUTES
// =========================================================================
// All routes here are already protected and have resolved tenant context
// from the parent companies router

/**
 * @route   GET /api/v1/companies/:companyId/leaves
 * @desc    Get all leave requests for the company
 * @access  ORG_ADMIN, HR_ADMIN, MANAGER, SUPER_ADMIN (all employees), EMPLOYEE (own only)
 */
router.get(
  '/',
  restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER, Role.EMPLOYEE, Role.SUPER_ADMIN),
  validate(getLeaveRequestsSchema),
  LeaveController.getLeaveRequests
);

/**
 * @route   POST /api/v1/companies/:companyId/leaves
 * @desc    Create a new leave request
 * @access  All authenticated employees
 */
router.post(
  '/',
  restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER, Role.EMPLOYEE, Role.SUPER_ADMIN),
  validate(createLeaveRequestSchema),
  LeaveController.createLeaveRequest
);

/**
 * @route   GET /api/v1/companies/:companyId/leaves/:leaveRequestId
 * @desc    Get leave request details by ID
 * @access  ORG_ADMIN, HR_ADMIN, MANAGER, SUPER_ADMIN (any request), EMPLOYEE (own only)
 */
router.get(
  '/:leaveRequestId',
  restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER, Role.EMPLOYEE, Role.SUPER_ADMIN),
  validate(getLeaveRequestSchema),
  LeaveController.getLeaveRequestById
);

/**
 * @route   PATCH /api/v1/companies/:companyId/leaves/:leaveRequestId
 * @desc    Update leave request status (approve/reject)
 * @access  ORG_ADMIN, HR_ADMIN, MANAGER, SUPER_ADMIN
 */
router.patch(
  '/:leaveRequestId',
  restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER, Role.SUPER_ADMIN),
  validate(updateLeaveRequestSchema),
  LeaveController.updateLeaveRequest
);

// =========================================================================
// LEAVE BALANCE ROUTES
// =========================================================================

/**
 * @route   GET /api/v1/companies/:companyId/leaves/balances/:employeeId
 * @desc    Get employee leave balances
 * @access  ORG_ADMIN, HR_ADMIN, MANAGER, SUPER_ADMIN (any employee), EMPLOYEE (own only)
 */
router.get(
  '/balances/:employeeId',
  restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER, Role.EMPLOYEE, Role.SUPER_ADMIN),
  validate(getLeaveBalancesSchema),
  LeaveController.getLeaveBalances
);

/**
 * @route   POST /api/v1/companies/:companyId/leaves/adjust/:employeeId
 * @desc    Manually adjust employee leave balance
 * @access  SUPER_ADMIN only
 */
router.post(
  '/adjust/:employeeId',
  restrictTo(Role.SUPER_ADMIN),
  validate(adjustLeaveBalanceSchema),
  LeaveController.adjustLeaveBalance
);

export default router;
