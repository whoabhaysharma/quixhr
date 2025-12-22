import { Router } from 'express';
import { leaveController } from '../controllers/leaveController';
import { authenticate, authorize } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', authorize(Role.ADMIN, Role.HR), leaveController.getAllLeaves);
router.get('/user/:userId', authorize(Role.ADMIN, Role.HR, Role.EMPLOYEE), leaveController.getLeavesByUserId); // Controller should ensure Employee only sees own leaves if not Admin/HR
router.post('/', authorize(Role.EMPLOYEE, Role.HR, Role.ADMIN), leaveController.requestLeave);
router.patch('/:id/status', authorize(Role.ADMIN, Role.HR), leaveController.updateLeaveStatus);

export default router;
