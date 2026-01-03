import { Router } from 'express';
import { Role } from '@prisma/client';
import { protect, resolveTenant, restrictTo, validate } from '@/shared/middleware';
import * as EmployeeController from './employees.controller';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  getEmployeesQuerySchema,
  employeeIdSchema
} from './employees.schema';

// Import related controllers for nested routes
import * as LeaveController from '../leaves/leaves.controller';
import { createLeaveRequestSchema } from '../leaves/leaves.schema';
import * as AllocationController from '../allocations/allocations.controller';
import { createLeaveAllocationSchema, getAllocationsSchema } from '../allocations/allocations.schema';

const router = Router();

// 1. Global Middleware
router.use(protect);       // Auth required
router.use(resolveTenant); // Tenant context required

// 2. Employee Routes

/**
 * @route   GET /api/v1/employees
 * @desc    List employees
 * @access  ORG_ADMIN, HR_ADMIN, MANAGER, SUPER_ADMIN
 */
router.get(
  '/',
  restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER, Role.SUPER_ADMIN, Role.EMPLOYEE),
  validate(getEmployeesQuerySchema),
  EmployeeController.getEmployees
);

/**
 * @route   GET /api/v1/employees/:id
 * @desc    Get employee details
 * @access  ORG_ADMIN, HR_ADMIN, MANAGER, SUPER_ADMIN, EMPLOYEE (Self)
 *          Note: "Self" access logic usually needs to be inside controller or a smart middleware. 
 *          Standard RestrictTo checks ROLE only.
 *          For now, we allow these roles. Controller logic allows access if authorized.
 */
router.get(
  '/:id',
  restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER, Role.SUPER_ADMIN, Role.EMPLOYEE),
  validate(employeeIdSchema),
  EmployeeController.getEmployee
);

/**
 * @route   PATCH /api/v1/employees/:id
 * @desc    Update employee
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
 * @access  SUPER_ADMIN Only (Strict)
 */
router.delete(
  '/:id',
  restrictTo(Role.SUPER_ADMIN),
  validate(employeeIdSchema),
  EmployeeController.deleteEmployee
);

// 3. Nested Routes (Leaves, Allocations)

// --- Leaves ---
router.post(
  '/:id/leave-requests',
  restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN, Role.EMPLOYEE),
  validate(createLeaveRequestSchema),
  LeaveController.createLeaveRequest
);

router.get(
  '/:id/leave-requests',
  restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER, Role.EMPLOYEE),
  // validate(leaveRequestQuerySchema), // Uncomment when ready
  LeaveController.getLeaveRequests
);

// --- Allocations ---
router.get(
  '/:id/allocations',
  restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER),
  validate(getAllocationsSchema),
  AllocationController.getEmployeeAllocations
);

router.post(
  '/:id/allocations',
  restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN),
  validate(createLeaveAllocationSchema),
  AllocationController.createEmployeeAllocation
);

// Note: Create Employee (POST) is typically handled on the Organization resource 
// or could be here if we rely on tenant context.
// But standard hierarchy often puts creation at `/org/:orgId/employees` or here if context is inferred.
// Since we have resolveTenant, we can allow creation here if organizationId is in query/header/user.
// However, the `createEmployee` function in controller relies on `getOrganizationContext`.
// Let's add the CREATE route here for completeness, as many REST APIs allow POST /employees if context is known.
// But mostly it's safer to keep it restricted.

// Let's add valid POST /
/**
 * @route   POST /api/v1/employees
 * @desc    Create new employee
 * @access  ORG_ADMIN, HR_ADMIN, SUPER_ADMIN
 */
router.post(
  '/',
  restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.SUPER_ADMIN),
  validate(createEmployeeSchema),
  EmployeeController.createEmployee
);

export default router;
