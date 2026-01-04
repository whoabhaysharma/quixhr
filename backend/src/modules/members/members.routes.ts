import { Router } from 'express';
import { Role } from '@prisma/client';
import { protect, restrictTo, validate, resolveTenant } from '@/shared/middleware';
import * as MemberController from './members.controller';
import {
    getUsersQuerySchema,
    userIdSchema,
    createEmployeeSchema,
    updateEmployeeSchema,
    updateMemberRoleSchema,
    updateMemberCalendarSchema,
    updateMemberLeaveGradeSchema
} from './members.schema';

// Import related controllers for nested routes (Lazy load or direct import if clean)
import * as LeaveController from '../leaves/leaves.controller';
import { createLeaveRequestSchema } from '../leaves/leaves.schema';
import * as AllocationController from '../allocations/allocations.controller';
import { createLeaveAllocationSchema, getAllocationsQuerySchema } from '../allocations/allocations.schema';


const router = Router({ mergeParams: true });

// Global Middleware
router.use(protect);
router.use(resolveTenant); // Apply to all routes to enable context logic

/**
 * @route   GET /api/v1/users
 * @desc    Get All (Context Aware)
 *          - If Tenant Context: List Employees
 *          - If Global Context: List Users
 */
router.get(
    '/',
    restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER, Role.EMPLOYEE),
    validate(getUsersQuerySchema), // Needs to handle combined query params? Or specialized schemas?
    // Note: getUsersQuerySchema might strict-check "unknown" keys if Zod set to strict.
    // If we want to support employee filters (status, etc.), we should combine schemas or use a relaxed one.
    // For now, let's assume loose validation or update the schema to include optional employee filters.
    MemberController.getUsers
);

/**
 * @route   POST /api/v1/users
 * @desc    Create User/Employee (Context Aware)
 */
router.post(
    '/',
    restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN),
    // Validation strategy: Body shape differs for User vs Employee.
    // Ideally we inspect context or body discriminator.
    // For now, if we assume primarily Employee creation in Org context, we use createEmployeeSchema.
    // If SuperAdmin creates Global User, schema fails?
    // Let's use createEmployeeSchema for now as that's the primary use case requested.
    validate(createEmployeeSchema),
    MemberController.createUser
);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get One (Context Aware)
 */
router.get(
    '/:id',
    restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER, Role.EMPLOYEE),
    MemberController.getUserById
);

/**
 * @route   PATCH /api/v1/users/:id
 * @desc    Update One (Context Aware)
 */
router.patch(
    '/:id',
    restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN),
    validate(updateEmployeeSchema), // Using employee update schema primarily
    MemberController.updateUser
);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete One (Context Aware)
 */
router.delete(
    '/:id',
    restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN),
    MemberController.deleteUser
);

/**
 * @route   PATCH /api/v1/users/:id/role
 * @desc    Update Member Role (Context & RBAC Aware)
 */
router.patch(
    '/:id/role',
    restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN),
    validate(updateMemberRoleSchema),
    MemberController.updateMemberRole
);

/**
 * @route   PATCH /api/v1/users/:id/calendar
 * @desc    Update Member Calendar (Context & RBAC Aware)
 */
router.patch(
    '/:id/calendar',
    restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN),
    validate(updateMemberCalendarSchema),
    MemberController.updateMemberCalendar
);

/**
 * @route   PATCH /api/v1/users/:id/leave-grade
 * @desc    Update Member Leave Grade (Context & RBAC Aware)
 */
router.patch(
    '/:id/leave-grade',
    restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN),
    validate(updateMemberLeaveGradeSchema),
    MemberController.updateMemberLeaveGrade
);

// --- Nested Routes (Leaves, Allocations) ---
// These are conceptually "Employee Resources", so they hang off /:id (which is EmployeeID/UserID)

router.post(
    '/:id/leave-requests',
    restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN, Role.EMPLOYEE),
    validate(createLeaveRequestSchema),
    LeaveController.createLeaveRequest
);

router.get(
    '/:id/leave-requests',
    restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER, Role.EMPLOYEE),
    LeaveController.getLeaveRequests
);

router.get(
    '/:id/allocations',
    restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER),
    validate(getAllocationsQuerySchema),
    AllocationController.getEmployeeAllocations
);

router.post(
    '/:id/allocations',
    restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN),
    validate(createLeaveAllocationSchema),
    AllocationController.createEmployeeAllocation
);

export default router;
