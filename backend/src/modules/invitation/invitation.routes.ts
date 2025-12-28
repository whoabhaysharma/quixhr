import { Router } from 'express';
import * as invitationController from './invitation.controller';
import { authMiddleware, requireRole } from '../../shared/middleware/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

// Public routes
router.get('/validate', invitationController.validate);
router.post('/accept', invitationController.accept);

// Protected routes (Admin only)
router.post(
    '/invite',
    authMiddleware,
    requireRole(Role.SUPER_ADMIN, Role.HR_ADMIN),
    invitationController.create
);

router.get(
    '/',
    authMiddleware,
    requireRole(Role.SUPER_ADMIN, Role.HR_ADMIN),
    invitationController.getAll
);

router.post(
    '/:id/resend',
    authMiddleware,
    requireRole(Role.SUPER_ADMIN, Role.HR_ADMIN),
    invitationController.resend
);

router.delete(
    '/:id',
    authMiddleware,
    requireRole(Role.SUPER_ADMIN, Role.HR_ADMIN),
    invitationController.deleteOne
);

export default router;
