import api from '../api';

export const subscriptionService = {
    // Create Razorpay Order
    createOrder: async (planId: string) => {
        const response = await api.post('/subscriptions/create-order', { planId });
        return response.data;
    },

    // Verify Payment
    verifyPayment: async (data: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
        organizationId: string;
        planId: string;
    }) => {
        const response = await api.post('/subscriptions/verify-payment', data);
        return response.data;
    },
};
