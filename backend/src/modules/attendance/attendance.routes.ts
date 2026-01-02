import { Router } from 'express';
import { protect } from '@/shared/middleware';
import validate from '@/shared/middleware/validate-resource.middleware';
import * as AttendanceController from './attendance.controller';
import { clockInSchema, clockOutSchema, dateQuerySchema } from './attendance.schema';

const router = Router();

router.use(protect);

// POST /api/v1/attendance/check-in
router.post(
    '/check-in',
    validate(clockInSchema),
    AttendanceController.clockIn
);

// POST /api/v1/attendance/check-out
router.post(
    '/check-out',
    validate(clockOutSchema),
    AttendanceController.clockOut
);

// GET /api/v1/attendance
router.get(
    '/',
    AttendanceController.getMyAttendance
);

// GET /api/v1/attendance/logs
router.get(
    '/logs',
    validate(dateQuerySchema),
    AttendanceController.getAttendanceLogs
);

export default router;
