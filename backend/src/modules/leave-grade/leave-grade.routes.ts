import { Router } from 'express';
import * as LeaveGradeController from './leave-grade.controller';
import * as LeaveGradeSchema from './leave-grade.schema';
import { protect, restrictTo } from '@/modules/auth/auth.middleware';
import { resolveTenant } from '@/shared/middleware/tenantContext';
import validate from '@/shared/middleware/validateResource';
import { Role } from '@prisma/client';

const router = Router();

// All routes require authentication and tenant resolution
router.use(protect);
router.use(resolveTenant);

/**
 * @route   GET /api/v1/leave-grades
 * @desc    List grades (Executive, Intern, Staff)
 * @access  HR Admin
 */
router.get(
    '/',
    restrictTo(Role.HR_ADMIN, Role.ORG_ADMIN, Role.SUPER_ADMIN),
    validate(LeaveGradeSchema.listLeaveGradesSchema),
    LeaveGradeController.listLeaveGrades
);

/**
 * @route   POST /api/v1/leave-grades
 * @desc    Create a new Grade
 * @access  HR Admin
 */
router.post(
    '/',
    restrictTo(Role.HR_ADMIN, Role.ORG_ADMIN, Role.SUPER_ADMIN),
    validate(LeaveGradeSchema.createLeaveGradeSchema),
    LeaveGradeController.createLeaveGrade
);

/**
 * @route   GET /api/v1/leave-grades/:id
 * @desc    View policies attached to a Grade
 * @access  HR Admin
 */
router.get(
    '/:id',
    restrictTo(Role.HR_ADMIN, Role.ORG_ADMIN, Role.SUPER_ADMIN),
    validate(LeaveGradeSchema.getLeaveGradeSchema),
    LeaveGradeController.getLeaveGrade
);

/**
 * @route   PATCH /api/v1/leave-grades/:id
 * @desc    Update a leave grade name
 * @access  HR Admin
 */
router.patch(
    '/:id',
    restrictTo(Role.HR_ADMIN, Role.ORG_ADMIN, Role.SUPER_ADMIN),
    validate(LeaveGradeSchema.getLeaveGradeSchema),
    LeaveGradeController.updateLeaveGrade
);

/**
 * @route   DELETE /api/v1/leave-grades/:id
 * @desc    Delete a leave grade (only if no employees assigned)
 * @access  HR Admin
 */
router.delete(
    '/:id',
    restrictTo(Role.HR_ADMIN, Role.ORG_ADMIN, Role.SUPER_ADMIN),
    validate(LeaveGradeSchema.getLeaveGradeSchema),
    LeaveGradeController.deleteLeaveGrade
);

/**
 * @route   POST /api/v1/leave-grades/:id/policy
 * @desc    Add a policy (e.g., "Sick Leave = 12 days")
 * @access  HR Admin
 */
router.post(
    '/:id/policy',
    restrictTo(Role.HR_ADMIN, Role.ORG_ADMIN, Role.SUPER_ADMIN),
    validate(LeaveGradeSchema.createLeavePolicySchema),
    LeaveGradeController.createLeavePolicy
);

/**
 * @route   PATCH /api/v1/leave-grades/:id/policy/:pid
 * @desc    Edit a policy (Update quota/rules)
 * @access  HR Admin
 */
router.patch(
    '/:id/policy/:pid',
    restrictTo(Role.HR_ADMIN, Role.ORG_ADMIN, Role.SUPER_ADMIN),
    validate(LeaveGradeSchema.updateLeavePolicySchema),
    LeaveGradeController.updateLeavePolicy
);

/**
 * @route   DELETE /api/v1/leave-grades/:id/policy/:pid
 * @desc    Delete a leave policy
 * @access  HR Admin
 */
router.delete(
    '/:id/policy/:pid',
    restrictTo(Role.HR_ADMIN, Role.ORG_ADMIN, Role.SUPER_ADMIN),
    validate(LeaveGradeSchema.deleteLeavePolicySchema),
    LeaveGradeController.deleteLeavePolicy
);

export default router;
