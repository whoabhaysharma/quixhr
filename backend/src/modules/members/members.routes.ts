import { Router } from 'express';
import { Role } from '@prisma/client';
import * as MemberController from './members.controller';
import { createMemberSchema, updateMemberSchema, getMembersQuerySchema } from './members.schema';
import { protect, resolveTenant, restrictTo, validate } from '@/shared/middleware';

// --- Nested Resources ---
import * as AllocationController from '../allocations/allocations.controller';
import { createLeaveAllocationSchema, getAllocationsQuerySchema } from '../allocations/allocations.schema';

const router = Router();

// Global Middleware for this module
router.use(protect);
router.use(resolveTenant);

// =========================================================================
// NESTED RESOURCES
// =========================================================================

// --- Allocations ---
/**
 * @route   GET /api/v1/members/:id/allocations
 * @desc    Get allocations for a specific member
 */
router.get(
    '/:id/allocations',
    restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER, Role.SUPER_ADMIN, Role.EMPLOYEE),
    validate(getAllocationsQuerySchema),
    AllocationController.getEmployeeAllocations
);

/**
 * @route   POST /api/v1/members/:id/allocations
 * @desc    Create allocation for a specific member
 */
router.post(
    '/:id/allocations',
    restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.SUPER_ADMIN),
    validate(createLeaveAllocationSchema),
    AllocationController.createEmployeeAllocation
);

// --- Leave Requests ---
import * as LeaveController from '../leaves/leaves.controller';
import { createLeaveRequestSchema, leaveRequestQuerySchema } from '../leaves/leaves.schema';

/**
 * @route   GET /api/v1/members/:employeeId/leave-requests
 * @desc    Get leave requests for a specific member
 */
router.get(
    '/:employeeId/leave-requests',
    restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER, Role.SUPER_ADMIN, Role.EMPLOYEE),
    validate(leaveRequestQuerySchema),
    LeaveController.getLeaveRequests
);

/**
 * @route   POST /api/v1/members/:employeeId/leave-requests
 * @desc    Create leave request for a specific member
 */
router.post(
    '/:employeeId/leave-requests',
    restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER, Role.SUPER_ADMIN, Role.EMPLOYEE),
    validate(createLeaveRequestSchema),
    LeaveController.createLeaveRequest
);

// =========================================================================
// MEMBER ROUTES
// =========================================================================

/**
 * @route   GET /api/v1/members
 * @desc    Get all members (Scoped by Org & Role)
 */
router.get(
    '/',
    restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER, Role.EMPLOYEE),
    validate(getMembersQuerySchema),
    MemberController.getMembers
);

/**
 * @route   POST /api/v1/members
 * @desc    Create a new member
 */
router.post(
    '/',
    restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN),
    validate(createMemberSchema),
    MemberController.createMember
);

/**
 * @route   GET /api/v1/members/:id
 * @desc    Get member details
 */
router.get(
    '/:id',
    restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER, Role.EMPLOYEE),
    MemberController.getMember
);

/**
 * @route   PATCH /api/v1/members/:id
 * @desc    Update member details
 */
router.patch(
    '/:id',
    restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN),
    validate(updateMemberSchema),
    MemberController.updateMember
);

/**
 * @route   DELETE /api/v1/members/:id
 * @desc    Delete a member
 */
router.delete(
    '/:id',
    restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN),
    MemberController.deleteMember
);

export default router;
