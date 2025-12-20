import { Router } from 'express';
import { subscriptionController } from '../controllers/subscriptionController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/plans', subscriptionController.getPlans);
router.get('/current', subscriptionController.getCurrentSubscription);
router.post('/', subscriptionController.createSubscription);

export default router;
