import { Router } from 'express';
import * as AttendanceController from './attendance.controller';
import * as AttendanceSchema from './attendance.schema';
import { protect, restrictTo } from '@/modules/auth/auth.middleware';
import { resolveTenant } from '@/shared/middleware/tenantContext';
import validate from '@/shared/middleware/validateResource';
import { Role } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(protect);

/**
 * @description  Clock In / Clock Out
 * @route        POST /api/v1/attendance/punch
 * @access       Employee (any authenticated user)
 */
router.post(
    '/punch',
    validate(AttendanceSchema.punchSchema),
    AttendanceController.punch
);

/**
 * @description  Get monthly attendance summary
 * @route        GET /api/v1/attendance/my-summary
 * @access       Employee (any authenticated user)
 */
router.get(
    '/my-summary',
    validate(AttendanceSchema.getMySummarySchema),
    AttendanceController.getMySummary
);

/**
 * @description  Bulk sync from biometric system
 * @route        POST /api/v1/attendance/bulk-sync
 * @access       System (requires special API key - to be implemented)
 * @note         For now, restricted to SUPER_ADMIN
 */
router.post(
    '/bulk-sync',
    restrictTo(Role.SUPER_ADMIN),
    validate(AttendanceSchema.bulkSyncSchema),
    AttendanceController.bulkSync
);

// Routes below require tenant resolution
router.use(resolveTenant);

/**
 * @description  Get daily attendance report
 * @route        GET /api/v1/attendance/report
 * @access       HR/Manager
 * @note         SUPER_ADMIN can filter by ?companyId=xxx
 */
router.get(
    '/report',
    restrictTo(Role.MANAGER, Role.HR_ADMIN, Role.ORG_ADMIN, Role.SUPER_ADMIN),
    validate(AttendanceSchema.getDailyReportSchema),
    AttendanceController.getDailyReport
);

/**
 * @description  Get raw punch logs (Biometric audit)
 * @route        GET /api/v1/attendance/logs/:id
 * @access       Admin
 */
router.get(
    '/logs/:id',
    restrictTo(Role.HR_ADMIN, Role.ORG_ADMIN, Role.SUPER_ADMIN),
    validate(AttendanceSchema.getLogsSchema),
    AttendanceController.getAttendanceLogs
);

/**
 * @description  Regularize attendance (Fix user's attendance)
 * @route        PATCH /api/v1/attendance/regularize
 * @access       Manager
 */
router.patch(
    '/regularize',
    restrictTo(Role.MANAGER, Role.HR_ADMIN, Role.ORG_ADMIN, Role.SUPER_ADMIN),
    validate(AttendanceSchema.regularizeSchema),
    AttendanceController.regularizeAttendance
);

export default router;
