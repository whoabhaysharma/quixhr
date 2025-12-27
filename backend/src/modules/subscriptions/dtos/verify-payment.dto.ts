/**
 * Input DTO for Razorpay payment verification
 */
export interface VerifyPaymentDto {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

/**
 * Validate payment verification request
 */
export function validateVerifyPaymentDto(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.razorpay_order_id || typeof data.razorpay_order_id !== 'string') {
        errors.push('razorpay_order_id is required and must be a string');
    }

    if (!data.razorpay_payment_id || typeof data.razorpay_payment_id !== 'string') {
        errors.push('razorpay_payment_id is required and must be a string');
    }

    if (!data.razorpay_signature || typeof data.razorpay_signature !== 'string') {
        errors.push('razorpay_signature is required and must be a string');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
