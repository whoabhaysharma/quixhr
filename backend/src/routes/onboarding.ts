import { Router } from 'express';
import { onboardingController } from '../controllers/onboardingController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Protect this route, user must be logged in (but might not have an Org yet)
router.post('/organization', authenticate, onboardingController.createOrganization);

export default router;
