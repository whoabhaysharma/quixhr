import { Router } from 'express';
import { Role } from '@prisma/client';
import { protect, restrictTo } from '@/shared/middleware';
import validate from '@/shared/middleware/validate-resource.middleware';
import * as LeaveController from './leaves.controller';
import {
    updateLeaveGradeSchema,
    createLeavePolicySchema,
    updateLeavePolicySchema,
    leaveGradeQuerySchema,
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

// =========================================================================
// 2. SUB-RESOURCES: POLICIES
// =========================================================================

// PATCH /api/v1/leaves/policies/:policyId
router.patch(
    '/policies/:policyId',
    restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN),
    validate(updateLeavePolicySchema),
    LeaveController.updatePolicy
);

// DELETE /api/v1/leaves/policies/:policyId
router.delete(
    '/policies/:policyId',
    restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN),
    LeaveController.deletePolicy
);

// =========================================================================
// 3. SINGLE GRADE & DEEP NESTED LISTS
// =========================================================================

// --- Get/Update/Delete Grade ---
router.get(
    '/grades/:gradeId',
    restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER),
    LeaveController.getLeaveGradeById
);

router.patch(
    '/grades/:gradeId',
    restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN),
    validate(updateLeaveGradeSchema),
    LeaveController.updateLeaveGrade
);

router.delete(
    '/grades/:gradeId',
    restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN),
    LeaveController.deleteLeaveGrade
);

// --- Sub-Resource List/Create (Needs Grade Context) ---

// GET /api/v1/leaves/grades/:gradeId/policies
router.get(
    '/grades/:gradeId/policies',
    restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER),
    LeaveController.getPolicies
);

// POST /api/v1/leaves/grades/:gradeId/policies
router.post(
    '/grades/:gradeId/policies',
    restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN),
    validate(createLeavePolicySchema),
    LeaveController.createPolicy
);

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

export default router;
