import { Router } from 'express';
import { organizationController } from './organization.controller';
import { authenticate, authorize } from '../../shared/middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', authorize(Role.ADMIN), organizationController.getAllOrganizations);
router.get('/:id', authorize(Role.ADMIN, Role.HR), organizationController.getOrganizationById);
router.post('/', authorize(Role.ADMIN), organizationController.createOrganization);
router.put('/:id', authorize(Role.ADMIN, Role.HR), organizationController.updateOrganization);
router.delete('/:id', authorize(Role.ADMIN), organizationController.deleteOrganization);

export default router;
