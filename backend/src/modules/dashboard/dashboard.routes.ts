import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authenticate } from '../../shared/middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/admin-stats', dashboardController.getAdminStats);
router.get('/employee-stats', dashboardController.getEmployeeStats);

export default router;
