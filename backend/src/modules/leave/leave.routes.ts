
import { Router } from 'express';
import * as leaveController from './leave.controller';
import { authMiddleware, requireRole } from '../../shared/middleware/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

// Apply for leave (Employees)
router.post(
    '/',
    authMiddleware,
    leaveController.apply
);

// Assign leave balance (Admin)
router.post(
    '/assign-balance',
    authMiddleware,
    requireRole(Role.SUPER_ADMIN, Role.HR_ADMIN),
    leaveController.assignBalance
);

// Get my balances
router.get(
    '/my-balances',
    authMiddleware,
    leaveController.getMyBalances
);

// Get my leaves (Employees)
router.get(
    '/my-leaves',
    authMiddleware,
    leaveController.getMyLeaves
);

// Get all leaves (Admin/HR - All, Manager - Team?)
// For now, restricting to HR/Super Admin/Manager.
router.get(
    '/',
    authMiddleware,
    requireRole(Role.SUPER_ADMIN, Role.HR_ADMIN, Role.MANAGER),
    leaveController.getAll
);

// Update status (Approve/Reject)
router.patch(
    '/:id/status',
    authMiddleware,
    requireRole(Role.SUPER_ADMIN, Role.HR_ADMIN, Role.MANAGER),
    leaveController.updateStatus
);

// Cancel leave
router.delete(
    '/:id',
    authMiddleware,
    leaveController.cancel
);

export default router;
