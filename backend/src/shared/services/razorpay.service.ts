import Razorpay from 'razorpay';
import crypto from 'crypto';

interface CreateOrderOptions {
    amount: number; // in paise
    currency?: string;
    receipt?: string;
    notes?: Record<string, string>;
}

class RazorpayService {
    private instance: Razorpay | null = null;

    constructor() {
        if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
            this.instance = new Razorpay({
                key_id: process.env.RAZORPAY_KEY_ID,
                key_secret: process.env.RAZORPAY_KEY_SECRET,
            });
        } else {
            console.warn("Razorpay credentials not found. Payment features will be disabled.");
        }
    }

    private getInstance(): Razorpay {
        if (!this.instance) {
            throw new Error("Razorpay not initialized. Missing API keys.");
        }
        return this.instance;
    }

    async createOrder(options: CreateOrderOptions) {
        try {
            const order = await this.getInstance().orders.create({
                amount: options.amount,
                currency: options.currency || 'INR',
                receipt: options.receipt,
                notes: options.notes,
            });
            return order;
        } catch (error) {
            console.error('Error creating Razorpay order:', error);
            throw error;
        }
    }

    verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
        const body = orderId + "|" + paymentId;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || '')
            .update(body.toString())
            .digest("hex");

        return expectedSignature === signature;
    }

    verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(body)
            .digest("hex");

        return expectedSignature === signature;
    }

    async fetchPayment(paymentId: string) {
        try {
            return await this.getInstance().payments.fetch(paymentId);
        } catch (error) {
            console.error('Error fetching Razorpay payment:', error);
            throw error;
        }
    }
}

export const razorpayService = new RazorpayService();
