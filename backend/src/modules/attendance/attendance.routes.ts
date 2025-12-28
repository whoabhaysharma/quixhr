import { Router } from 'express';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import * as attendanceController from './attendance.controller';

const router = Router();

router.post('/clock-in', authMiddleware, attendanceController.checkIn);
router.put('/clock-out', authMiddleware, attendanceController.checkOut);
router.get('/today', authMiddleware, attendanceController.getToday);
router.get('/me', authMiddleware, attendanceController.getMyAppAttendance);

// Aliases for consistency/legacy if needed
router.post('/check-in', authMiddleware, attendanceController.checkIn);
router.post('/check-out', authMiddleware, attendanceController.checkOut);
router.get('/my-attendance', authMiddleware, attendanceController.getMyAppAttendance);

export default router;
