import { Router } from 'express';
import * as DashboardController from './dashboard.controller';
import { protect } from '@/shared/middleware';

const router = Router();

router.use(protect);

router.get('/stats', DashboardController.getDashboardStats);

export default router;
