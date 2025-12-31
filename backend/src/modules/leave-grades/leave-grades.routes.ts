import { Router } from 'express';
import { Role } from '@prisma/client';
import * as LeaveGradeController from './leave-grades.controller';
import {
  createLeaveGradeSchema,
  updateLeaveGradeSchema,
  getLeaveGradeSchema,
  getLeaveGradesSchema,
  deleteLeaveGradeSchema,
} from './leave-grades.schema';
import { restrictTo, validate } from '@/shared/middleware';

const router = Router();

// =========================================================================
// LEAVE GRADE ROUTES
// =========================================================================
// All routes here are already protected and have resolved tenant context
// from the parent companies router

/**
 * @route   GET /api/v1/companies/:companyId/leave-grades
 * @desc    Get all leave grades for the company
 * @access  ORG_ADMIN, HR_ADMIN, MANAGER, SUPER_ADMIN
 */
router.get(
  '/',
  restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER, Role.SUPER_ADMIN),
  validate(getLeaveGradesSchema),
  LeaveGradeController.getLeaveGrades
);

/**
 * @route   POST /api/v1/companies/:companyId/leave-grades
 * @desc    Create a new leave grade
 * @access  ORG_ADMIN, HR_ADMIN, SUPER_ADMIN
 */
router.post(
  '/',
  restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.SUPER_ADMIN),
  validate(createLeaveGradeSchema),
  LeaveGradeController.createLeaveGrade
);

/**
 * @route   GET /api/v1/companies/:companyId/leave-grades/:leaveGradeId
 * @desc    Get leave grade details by ID
 * @access  ORG_ADMIN, HR_ADMIN, MANAGER, SUPER_ADMIN
 */
router.get(
  '/:leaveGradeId',
  restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER, Role.SUPER_ADMIN),
  validate(getLeaveGradeSchema),
  LeaveGradeController.getLeaveGradeById
);

/**
 * @route   PATCH /api/v1/companies/:companyId/leave-grades/:leaveGradeId
 * @desc    Update leave grade details
 * @access  ORG_ADMIN, HR_ADMIN, SUPER_ADMIN
 */
router.patch(
  '/:leaveGradeId',
  restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.SUPER_ADMIN),
  validate(updateLeaveGradeSchema),
  LeaveGradeController.updateLeaveGrade
);

/**
 * @route   DELETE /api/v1/companies/:companyId/leave-grades/:leaveGradeId
 * @desc    Delete leave grade
 * @access  SUPER_ADMIN only
 */
router.delete(
  '/:leaveGradeId',
  restrictTo(Role.SUPER_ADMIN),
  validate(deleteLeaveGradeSchema),
  LeaveGradeController.deleteLeaveGrade
);

export default router;