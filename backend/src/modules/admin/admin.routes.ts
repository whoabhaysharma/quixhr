import { Router } from 'express';
import { Role } from '@prisma/client';
import * as AdminController from './admin.controller';
import { protect, restrictTo } from '@/shared/middleware';

const router = Router();

// All routes here are restricted to Super Admin
router.use(protect);
router.use(restrictTo(Role.SUPER_ADMIN));

router.get('/dashboard', AdminController.getPlatformDashboard);

export default router;
