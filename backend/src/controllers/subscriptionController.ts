import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { SubscriptionService } from '../services/subscriptionService';
import { ROLES } from '../constants';

const subscriptionService = new SubscriptionService();

export class SubscriptionController {
    async getPlans(req: AuthRequest, res: Response): Promise<void> {
        try {
            const plans = await subscriptionService.getPlans();
            res.status(200).json(plans);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    async getCurrentSubscription(req: AuthRequest, res: Response): Promise<void> {
        try {
            if (!req.user?.organizationId) {
                res.status(400).json({ message: 'Organization context required' });
                return;
            }

            const subscription = await subscriptionService.getSubscription(req.user.organizationId);

            if (!subscription) {
                res.status(404).json({ message: 'No active subscription found' });
                return;
            }

            res.status(200).json(subscription);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    async createSubscription(req: AuthRequest, res: Response): Promise<void> {
        try {
            // Only Admin/HR can subscribe
            if (req.user?.role !== ROLES.HR && req.user?.role !== ROLES.ADMIN) {
                res.status(403).json({ message: 'Insufficient permissions' });
                return;
            }

            const { planId, orderId, amountPaid, durationDays } = req.body;
            if (!req.user?.organizationId) {
                res.status(400).json({ message: 'Organization context required' });
                return;
            }

            const subscription = await subscriptionService.createSubscription(
                req.user.organizationId,
                planId,
                orderId,
                amountPaid,
                durationDays
            );

            res.status(201).json({
                message: 'Subscription created successfully',
                subscription
            });
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }
}

export const subscriptionController = new SubscriptionController();
