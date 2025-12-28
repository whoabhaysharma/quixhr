import { Router } from 'express';
import { getAuditLogsHandler } from './audit.controller';
import { authMiddleware, requireRole } from '../../shared/middleware/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

// Protect all routes
router.use(authMiddleware);

// Get all audit logs (HR & Super Admin Only)
router.get('/', requireRole(Role.SUPER_ADMIN, Role.HR_ADMIN), getAuditLogsHandler);

export default router;
