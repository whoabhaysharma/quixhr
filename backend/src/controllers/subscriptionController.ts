import { Request, Response, NextFunction } from 'express';
import { subscriptionService } from '../services/subscriptionService';

class SubscriptionController {
    async getSubscriptionByOrganizationId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizationId = Number(req.params.organizationId);
            const subscription = await subscriptionService.getSubscriptionByOrganizationId(organizationId);

            if (!subscription) {
                res.status(404).json({ success: false, error: { message: 'Subscription not found' } });
                return;
            }

            res.json({ success: true, data: { subscription } });
        } catch (error) {
            next(error);
        }
    }

    async createSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { organizationId, planId, orderId, amountPaid, startDate, endDate } = req.body;
            const subscription = await subscriptionService.createSubscription({
                organizationId,
                planId,
                orderId,
                amountPaid,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
            });
            res.status(201).json({ success: true, data: { subscription } });
        } catch (error) {
            next(error);
        }
    }

    async updateSubscriptionStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(req.params.id);
            const { status } = req.body;
            const subscription = await subscriptionService.updateSubscriptionStatus(id, status);
            res.json({ success: true, data: { subscription } });
        } catch (error) {
            next(error);
        }
    }
}

export const subscriptionController = new SubscriptionController();
