import { Router } from 'express';
import { sendInvite, validateInvite, acceptInvite } from '../controllers/inviteController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Send invite (Admin/HR only - for now just authenticated)
router.post('/', authenticate, sendInvite);

// Validate invite token (Public)
router.get('/:token', validateInvite);

// Accept invite (Authenticated user)
router.post('/:token/accept', authenticate, acceptInvite);

export default router;
