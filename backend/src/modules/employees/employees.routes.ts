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
// All routes here are already protected and have resolved tenant context
// from the parent companies router

/**
 * @route   GET /api/v1/companies/:companyId/employees
 * @desc    Get all employees for the company
 * @access  ORG_ADMIN, HR_ADMIN, MANAGER, SUPER_ADMIN
 */
router.get(
  '/',
  restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER, Role.SUPER_ADMIN),
  validate(getEmployeesSchema),
  EmployeeController.getEmployees
);

/**
 * @route   POST /api/v1/companies/:companyId/employees
 * @desc    Create a new employee
 * @access  ORG_ADMIN, HR_ADMIN, SUPER_ADMIN
 */
router.post(
  '/',
  restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.SUPER_ADMIN),
  validate(createEmployeeSchema),
  EmployeeController.createEmployee
);

/**
 * @route   GET /api/v1/companies/:companyId/employees/:employeeId
 * @desc    Get employee details by ID
 * @access  ORG_ADMIN, HR_ADMIN, MANAGER, SUPER_ADMIN (+ own profile access handled in controller)
 */
router.get(
  '/:employeeId',
  restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER, Role.EMPLOYEE, Role.SUPER_ADMIN),
  validate(getEmployeeSchema),
  EmployeeController.getEmployeeById
);

/**
 * @route   PATCH /api/v1/companies/:companyId/employees/:employeeId
 * @desc    Update employee details
 * @access  ORG_ADMIN, HR_ADMIN, SUPER_ADMIN
 */
router.patch(
  '/:employeeId',
  restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.SUPER_ADMIN),
  validate(updateEmployeeSchema),
  EmployeeController.updateEmployee
);

/**
 * @route   DELETE /api/v1/companies/:companyId/employees/:employeeId
 * @desc    Delete employee
 * @access  SUPER_ADMIN only
 */
router.delete(
  '/:employeeId',
  restrictTo(Role.SUPER_ADMIN),
  validate(deleteEmployeeSchema),
  EmployeeController.deleteEmployee
);

// --- Nested: Leave Requests ---

// POST /api/v1/companies/:companyId/employees/:employeeId/leave-requests
router.post(
  '/:employeeId/leave-requests',
  restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN, Role.EMPLOYEE),
  validate(createLeaveRequestSchema),
  LeaveController.createLeaveRequest
);

// GET /api/v1/companies/:companyId/employees/:employeeId/leave-requests
router.get(
  '/:employeeId/leave-requests',
  restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER, Role.EMPLOYEE),
  // validate(leaveRequestQuerySchema),
  LeaveController.getLeaveRequests
);

// --- Nested: Leave Allocations ---
import * as AllocationController from '../allocations/allocations.controller';
import { createLeaveAllocationSchema, getAllocationsSchema } from '../allocations/allocations.schema';

// GET /api/v1/companies/:companyId/employees/:employeeId/allocations
router.get(
  '/:employeeId/allocations',
  restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER),
  validate(getAllocationsSchema),
  AllocationController.getEmployeeAllocations
);

// POST /api/v1/companies/:companyId/employees/:employeeId/allocations
router.post(
  '/:employeeId/allocations',
  restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN),
  validate(createLeaveAllocationSchema),
  AllocationController.createEmployeeAllocation
);

export default router;

