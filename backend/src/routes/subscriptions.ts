import { Router } from 'express';
import { subscriptionController } from '../controllers/subscriptionController';
import { authenticate, authorize } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/organization/:organizationId', authorize(Role.ADMIN, Role.HR), subscriptionController.getSubscriptionByOrganizationId);
router.post('/', authorize(Role.ADMIN), subscriptionController.createSubscription);
router.patch('/:id/status', authorize(Role.ADMIN), subscriptionController.updateSubscriptionStatus);

export default router;
