import { Router } from 'express';
import { subscriptionController } from './subscription.controller';
import { authenticate, authorize } from '../../shared/middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/organization/:organizationId', authorize(Role.ADMIN, Role.HR), subscriptionController.getSubscriptionByOrganizationId);
router.post('/', authorize(Role.ADMIN), subscriptionController.createSubscription);
router.post('/create-order', authorize(Role.ADMIN), subscriptionController.createOrder);
router.post('/verify-payment', authorize(Role.ADMIN), subscriptionController.verifyPayment);
router.patch('/:id/status', authorize(Role.ADMIN), subscriptionController.updateSubscriptionStatus);

export default router;
