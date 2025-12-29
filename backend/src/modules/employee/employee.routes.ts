import { Router } from 'express';
import * as EmployeeController from './employee.controller';
import * as EmployeeSchema from './employee.schema';
import { protect, restrictTo } from '@/modules/auth/auth.middleware';
import { resolveTenant } from '@/shared/middleware/tenantContext';
import validate from '@/shared/middleware/validateResource';
import { Role } from '@prisma/client';

const router = Router();

// All routes require authentication and tenant resolution
router.use(protect);
router.use(resolveTenant);

/**
 * @description  Get current employee's own profile
 * @route        GET /api/v1/employees/my-profile
 * @access       Employee (any authenticated user)
 */
router.get(
    '/my-profile',
    EmployeeController.getMyProfile
);

/**
 * @description  Bulk import employees via CSV
 * @route        POST /api/v1/employees/import
 * @access       HR Admin
 */
router.post(
    '/import',
    restrictTo(Role.HR_ADMIN, Role.ORG_ADMIN, Role.SUPER_ADMIN),
    validate(EmployeeSchema.importEmployeesSchema),
    EmployeeController.importEmployees
);

/**
 * @description  List all employees with optional filters
 * @route        GET /api/v1/employees
 * @access       Manager+
 * @note         SUPER_ADMIN can filter by ?companyId=xxx to view employees from any company
 */
router.get(
    '/',
    restrictTo(Role.MANAGER, Role.HR_ADMIN, Role.ORG_ADMIN, Role.SUPER_ADMIN),
    validate(EmployeeSchema.listEmployeesSchema),
    EmployeeController.listEmployees
);

/**
 * @description  Create new employee (manual entry)
 * @route        POST /api/v1/employees
 * @access       HR Admin
 */
router.post(
    '/',
    restrictTo(Role.HR_ADMIN, Role.ORG_ADMIN, Role.SUPER_ADMIN),
    validate(EmployeeSchema.createEmployeeSchema),
    EmployeeController.createEmployee
);

/**
 * @description  Get employee by ID with full profile
 * @route        GET /api/v1/employees/:id
 * @access       Manager+
 */
router.get(
    '/:id',
    restrictTo(Role.MANAGER, Role.HR_ADMIN, Role.ORG_ADMIN, Role.SUPER_ADMIN),
    validate(EmployeeSchema.getEmployeeByIdSchema),
    EmployeeController.getEmployeeById
);

/**
 * @description  Update employee profile
 * @route        PATCH /api/v1/employees/:id
 * @access       HR Admin
 */
router.patch(
    '/:id',
    restrictTo(Role.HR_ADMIN, Role.ORG_ADMIN, Role.SUPER_ADMIN),
    validate(EmployeeSchema.updateEmployeeSchema),
    EmployeeController.updateEmployee
);

/**
 * @description  Assign calendar (shift) and/or leave grade (policy) to employee
 * @route        PATCH /api/v1/employees/:id/assign
 * @access       HR Admin
 */
router.patch(
    '/:id/assign',
    restrictTo(Role.HR_ADMIN, Role.ORG_ADMIN, Role.SUPER_ADMIN),
    validate(EmployeeSchema.assignConfigSchema),
    EmployeeController.assignConfig
);

/**
 * @description  Update employee status (for offboarding)
 * @route        PATCH /api/v1/employees/:id/status
 * @access       HR Admin
 */
router.patch(
    '/:id/status',
    restrictTo(Role.HR_ADMIN, Role.ORG_ADMIN, Role.SUPER_ADMIN),
    validate(EmployeeSchema.updateStatusSchema),
    EmployeeController.updateStatus
);

export default router;

