import { Router } from 'express';
import { webhookController } from './webhooks.controller';

const router = Router();

router.post('/razorpay', webhookController.handleRazorpayWebhook);

export default router;
