import { Router } from 'express';
import { Role } from '@prisma/client';
import { protect, resolveTenant, restrictTo, validate } from '@/shared/middleware';
import * as AttendanceController from './attendance.controller';
import { clockInSchema, clockOutSchema, getAttendanceQuerySchema } from './attendance.schema';

const router = Router();

// Global Middleware
router.use(protect);
router.use(resolveTenant);

// =========================================================================
// EMPLOYEE ROUTES
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
    // Validate date query manually or via generic schema if strictly needed
    // But controller handles defaults.
    AttendanceController.getMyAttendance
);

// =========================================================================
// ADMIN ROUTES
// =========================================================================

/**
 * @route   GET /api/v1/attendance
 * @desc    List All Attendance (For Admins)
 * @access  ORG_ADMIN, HR_ADMIN, MANAGER, SUPER_ADMIN
 */
router.get(
    '/',
    restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER, Role.SUPER_ADMIN),
    validate(getAttendanceQuerySchema),
    AttendanceController.getAllAttendance
);

export default router;
