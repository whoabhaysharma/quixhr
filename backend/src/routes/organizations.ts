import { Router } from 'express';
import { organizationController } from '../controllers/organizationController';
import { authenticateToken, authorize } from '../middleware/auth';
import { ROLES } from '../constants';

const router = Router();

router.use(authenticateToken);

router.get('/me', organizationController.getOrganization);
router.put('/me', authorize(ROLES.HR, ROLES.ADMIN), organizationController.updateOrganization);

export default router;
