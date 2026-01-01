import { Router } from 'express';
import { Role } from '@prisma/client';
import * as AllocationController from './allocations.controller';
import { protect, restrictTo, validate } from '@/shared/middleware';
import {
    createLeaveAllocationSchema,
    updateLeaveAllocationSchema,
    getAllocationsSchema,
} from './allocations.schema';

const router = Router();

// All routes require authentication
router.use(protect);

// =========================================================================
// FLAT ALLOCATION ROUTES (Resource-based)
// =========================================================================

/**
 * @route   GET /api/v1/allocations/:allocationId
 * @desc    Get allocation by ID
 * @access  Protected (HR_ADMIN, ORG_ADMIN, MANAGER, SUPER_ADMIN)
 */
router.get(
    '/:allocationId',
    restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER),
    AllocationController.getAllocationById
);

/**
 * @route   PATCH /api/v1/allocations/:allocationId
 * @desc    Update allocation
 * @access  Protected (HR_ADMIN, ORG_ADMIN, SUPER_ADMIN)
 */
router.patch(
    '/:allocationId',
    restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN),
    validate(updateLeaveAllocationSchema),
    AllocationController.updateAllocation
);

/**
 * @route   DELETE /api/v1/allocations/:allocationId
 * @desc    Delete allocation
 * @access  Protected (HR_ADMIN, ORG_ADMIN, SUPER_ADMIN)
 */
router.delete(
    '/:allocationId',
    restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN),
    AllocationController.deleteAllocation
);

export default router;
