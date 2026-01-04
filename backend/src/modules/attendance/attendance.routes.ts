import { Router } from 'express';
import { Role } from '@prisma/client';
import { protect, restrictTo, validate } from '@/shared/middleware';
import * as AttendanceController from './attendance.controller';
import { clockInSchema, clockOutSchema, getAttendanceQuerySchema } from './attendance.schema';

const router = Router();

// Global Middleware
router.use(protect);

// =========================================================================
// PERSONAL ATTENDANCE ROUTES (All Authenticated Users)
// =========================================================================

/**
 * @route   POST /api/v1/attendance/check-in
 * @desc    Clock In
 * @access  All Authenticated Users (linked to Employee)
 */
router.post(
    '/check-in',
    validate(clockInSchema),
    AttendanceController.clockIn
);

/**
 * @route   POST /api/v1/attendance/check-out
 * @desc    Clock Out
 * @access  All Authenticated Users (linked to Employee)
 */
router.post(
    '/check-out',
    validate(clockOutSchema),
    AttendanceController.clockOut
);

/**
 * @route   GET /api/v1/attendance/me
 * @desc    Get My Attendance Logs (Today or Specific Date)
 * @access  All Authenticated Users
 */
router.get(
    '/me',
    AttendanceController.getMyAttendance
);

// =========================================================================
// SUPER ADMIN ROUTES (Cross-Organization Access)
// =========================================================================

/**
 * @route   GET /api/v1/attendance
 * @desc    List All Attendance Across Organizations
 * @access  SUPER_ADMIN only
 * @note    For organization-scoped access, use /api/v1/org/:organizationId/attendance
 */
router.get(
    '/',
    restrictTo(Role.SUPER_ADMIN),
    validate(getAttendanceQuerySchema),
    AttendanceController.getAllAttendanceSuperAdmin
);

/**
 * @route   PATCH /api/v1/attendance/:attendanceId
 * @desc    Update Attendance Record by ID
 * @access  Authorized users (with proper validation in controller)
 * @note    Controller validates user has permission to update this specific record
 */
router.patch(
    '/:attendanceId',
    AttendanceController.updateAttendance
);

export default router;
