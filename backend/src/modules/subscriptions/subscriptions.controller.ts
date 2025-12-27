import { Request, Response, NextFunction } from 'express';
import { subscriptionService } from './subscription.service';
import { razorpayService } from './razorpay.service';

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

    async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { planId, organizationId } = req.body;
            // In a real app, fetch plan details from DB to get amount
            // For now, assuming amount is passed or hardcoded for demo
            const amount = 99900; // Example: 999 INR in paise

            const order = await razorpayService.createOrder({
                amount,
                currency: 'INR',
                receipt: `receipt_${Date.now()}`,
                notes: { planId, organizationId }
            });

            res.status(201).json({ success: true, data: { order } });
        } catch (error) {
            next(error);
        }
    }

    async verifyPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature, organizationId, planId } = req.body;

            const isValid = razorpayService.verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

            if (!isValid) {
                res.status(400).json({ success: false, error: { message: 'Invalid payment signature' } });
                return;
            }

            // Payment verified, create subscription
            // Fetch payment details to get exact amount if needed
            // const paymentDetails = await razorpayService.fetchPayment(razorpay_payment_id);

            const subscription = await subscriptionService.createSubscription({
                organizationId,
                planId,
                orderId: razorpay_order_id,
                paymentId: razorpay_payment_id,
                amountPaid: 99900, // Should come from plan/order
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 days example
            });

            res.status(201).json({ success: true, data: { subscription } });
        } catch (error) {
            next(error);
        }
    }

    async createSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
        // ... kept for manual creation if needed, but verifyPayment is primary now
        try {
            // ... existing implementation
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
            const id = req.params.id; // Changed to string as UUID
            const { status } = req.body;
            const subscription = await subscriptionService.updateSubscriptionStatus(id, status);
            res.json({ success: true, data: { subscription } });
        } catch (error) {
            next(error);
        }
    }
}

export const subscriptionController = new SubscriptionController();
