import { Router } from 'express';
import { Role } from '@prisma/client';
import * as EmployeeController from './employees.controller';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  getEmployeeSchema,
  getEmployeesSchema,
  deleteEmployeeSchema,
} from './employees.schema';

import * as LeaveController from '../leaves/leaves.controller';
import { createLeaveRequestSchema } from '../leaves/leaves.schema';

import { restrictTo, validate } from '@/shared/middleware';

const router = Router();

// =========================================================================
// EMPLOYEE ROUTES
// =========================================================================

// Global Middleware: Resolve Tenant for ALL employee routes
// Since this is a flat resource, resolveTenant will use the user's token
// or query param (for super admin) to determine targetCompanyId
import { resolveTenant } from '@/shared/middleware';
router.use(resolveTenant);

/**
 * @route   GET /api/v1/employees
 * @desc    Get all employees (Scoped by tenant)
 * @access  ORG_ADMIN, HR_ADMIN, MANAGER, SUPER_ADMIN
 */
router.get(
  '/',
  restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER, Role.SUPER_ADMIN),
  validate(getEmployeesSchema),
  EmployeeController.getEmployees
);

// Note: POST /api/v1/companies/:companyId/employees is handled in companies.routes.ts

/**
 * @route   GET /api/v1/employees/:id
 * @desc    Get employee details by ID
 * @access  ORG_ADMIN, HR_ADMIN, MANAGER, SUPER_ADMIN (+ own profile access handled in controller)
 */
router.get(
  '/:id',
  restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER, Role.EMPLOYEE, Role.SUPER_ADMIN),
  validate(getEmployeeSchema),
  EmployeeController.getEmployeeById
);

/**
 * @route   PATCH /api/v1/employees/:id
 * @desc    Update employee details
 * @access  ORG_ADMIN, HR_ADMIN, SUPER_ADMIN
 */
router.patch(
  '/:id',
  restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.SUPER_ADMIN),
  validate(updateEmployeeSchema),
  EmployeeController.updateEmployee
);

/**
 * @route   DELETE /api/v1/employees/:id
 * @desc    Delete employee
 * @access  SUPER_ADMIN only
 */
router.delete(
  '/:id',
  restrictTo(Role.SUPER_ADMIN),
  validate(deleteEmployeeSchema),
  EmployeeController.deleteEmployee
);

// --- Nested: Leave Requests ---

// --- Nested: Leave Requests ---

// POST /api/v1/employees/:id/leave-requests
router.post(
  '/:id/leave-requests',
  restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN, Role.EMPLOYEE),
  validate(createLeaveRequestSchema),
  LeaveController.createLeaveRequest
);

// GET /api/v1/employees/:id/leave-requests
router.get(
  '/:id/leave-requests',
  restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER, Role.EMPLOYEE),
  // validate(leaveRequestQuerySchema),
  LeaveController.getLeaveRequests
);

// --- Nested: Leave Allocations ---
import * as AllocationController from '../allocations/allocations.controller';
import { createLeaveAllocationSchema, getAllocationsSchema } from '../allocations/allocations.schema';

// GET /api/v1/employees/:id/allocations
router.get(
  '/:id/allocations',
  restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER),
  validate(getAllocationsSchema),
  AllocationController.getEmployeeAllocations
);

// POST /api/v1/employees/:id/allocations
router.post(
  '/:id/allocations',
  restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN),
  validate(createLeaveAllocationSchema),
  AllocationController.createEmployeeAllocation
);

export default router;

