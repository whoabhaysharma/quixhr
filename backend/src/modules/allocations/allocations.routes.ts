import { Router } from 'express';
import { Role } from '@prisma/client';
import { protect, resolveTenant, restrictTo, validate } from '@/shared/middleware';
import * as AllocationController from './allocations.controller';
import {
    createLeaveAllocationSchema,
    updateLeaveAllocationSchema,
    getAllocationsQuerySchema,
    bulkAllocateSchema,
    allocationIdSchema,
} from './allocations.schema';

const router = Router();

// Global Middleware
router.use(protect);
router.use(resolveTenant);

// =========================================================================
// FLAT ALLOCATION ROUTES
// =========================================================================

/**
 * @route   GET /api/v1/allocations
 * @desc    Get all allocations (Scoped by tenant)
 * @access  Protected (HR_ADMIN, ORG_ADMIN, MANAGER, SUPER_ADMIN)
 */
router.get(
    '/',
    restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER),
    validate(getAllocationsQuerySchema),
    AllocationController.getAllocations
);

/**
 * @route   POST /api/v1/allocations/bulk
 * @desc    Bulk allocate leaves
 * @access  Protected (HR_ADMIN, ORG_ADMIN, SUPER_ADMIN)
 */
router.post(
    '/bulk',
    restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN),
    validate(bulkAllocateSchema),
    AllocationController.bulkAllocate
);

/**
 * @route   GET /api/v1/allocations/:allocationId
 * @desc    Get allocation by ID
 * @access  Protected (HR_ADMIN, ORG_ADMIN, MANAGER, SUPER_ADMIN)
 */
router.get(
    '/:allocationId',
    restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER),
    validate(allocationIdSchema),
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
    validate(allocationIdSchema),
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
    validate(allocationIdSchema),
    AllocationController.deleteAllocation
);

export default router;
