import { Router } from 'express';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import * as attendanceController from './attendance.controller';

const router = Router();

router.post('/check-in', authMiddleware, attendanceController.checkIn);
router.post('/check-out', authMiddleware, attendanceController.checkOut);
router.get('/my-attendance', authMiddleware, attendanceController.getMyAppAttendance);

export default router;
