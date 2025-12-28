import { Router } from 'express';
import * as memberController from './member.controller';
import { authMiddleware, requireRole } from '../../shared/middleware/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

// Protect all routes
router.use(authMiddleware);

// Create member (HR Only)
router.post('/', requireRole(Role.SUPER_ADMIN, Role.HR_ADMIN), memberController.create);

// Get all members (HR & Manager)
router.get('/', requireRole(Role.SUPER_ADMIN, Role.HR_ADMIN, Role.MANAGER), memberController.getAll);

// Assign calendar to member (HR Only)
router.post('/:id/calendar', requireRole(Role.SUPER_ADMIN, Role.HR_ADMIN), memberController.assignCalendar);

// Get single member (All authenticated - controller handles specific permission)
router.get('/:id', memberController.getOne);

// Update member (HR Only)
router.patch('/:id', requireRole(Role.SUPER_ADMIN, Role.HR_ADMIN), memberController.update);

// Delete member (HR Only)
router.delete('/:id', requireRole(Role.SUPER_ADMIN, Role.HR_ADMIN), memberController.deleteOne);

export default router;
