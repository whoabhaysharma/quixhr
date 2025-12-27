import { Router } from 'express';
import * as companyController from './company.controller';
import { authMiddleware, requireRole } from '../../shared/middleware/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

// Private routes
router.use(authMiddleware);

router.post('/', requireRole(Role.SUPER_ADMIN), companyController.create);
router.get('/', requireRole(Role.SUPER_ADMIN), companyController.getAll);
router.get('/:id', companyController.getOne);
router.patch('/:id', requireRole(Role.SUPER_ADMIN, Role.HR_ADMIN), companyController.update);
router.delete('/:id', requireRole(Role.SUPER_ADMIN), companyController.deleteOne);

export default router;
