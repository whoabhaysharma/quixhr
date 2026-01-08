import { Router } from 'express';
import { Role } from '@prisma/client';
import { protect, restrictTo, validate } from '@/shared/middleware';
import * as LeaveController from './leaves.controller';
import {
    updateLeaveGradeSchema,
    createLeavePolicySchema,
    updateLeavePolicySchema,
    leaveGradeQuerySchema,
    createLeaveRequestSchema,
    updateLeaveRequestSchema,
    updateLeaveRequestStatusSchema
} from './leaves.schema';

const router = Router();
router.use(protect);

// =========================================================================
// 1. GLOBAL LIST (Super Admin)
// =========================================================================

router.get(
    '/grades',
    restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER),
    validate(leaveGradeQuerySchema),
    LeaveController.getLeaveGrades
);

// ... (skipping policies routes they are fine) ...

// =========================================================================
// 4. LEAVE REQUESTS (Management)
// =========================================================================
// Routes for Approving/Rejecting requests (Flat Access)

// PATCH /api/v1/leaves/requests/:requestId/status
router.patch(
    '/requests/:requestId/status',
    restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER),
    validate(updateLeaveRequestStatusSchema),
    LeaveController.updateLeaveRequestStatus
);

// PATCH /api/v1/leaves/requests/:requestId (Update Details)
router.patch(
    '/requests/:requestId',
    restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER),
    validate(updateLeaveRequestSchema),
    LeaveController.updateLeaveRequest
);

// DELETE /api/v1/leaves/requests/:requestId
router.delete(
    '/requests/:requestId',
    // Permissions handled in service/controller
    LeaveController.deleteLeaveRequest
);



export default router;
