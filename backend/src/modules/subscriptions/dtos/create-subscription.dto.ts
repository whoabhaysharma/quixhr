/**
 * Input DTO for creating a subscription (from payment)
 */
export interface CreateSubscriptionDto {
    organizationId: string;
    planId: string;
    orderId: string;
    paymentId?: string;
    amountPaid: number;
}

/**
 * Validate create subscription request
 */
export function validateCreateSubscriptionDto(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.organizationId || typeof data.organizationId !== 'string') {
        errors.push('organizationId is required and must be a string');
    }

    if (!data.planId || typeof data.planId !== 'string') {
        errors.push('planId is required and must be a string');
    }

    if (!data.orderId || typeof data.orderId !== 'string') {
        errors.push('orderId is required and must be a string');
    }

    if (data.paymentId !== undefined && typeof data.paymentId !== 'string') {
        errors.push('paymentId must be a string');
    }

    if (data.amountPaid === undefined || typeof data.amountPaid !== 'number') {
        errors.push('amountPaid is required and must be a number');
    } else if (data.amountPaid <= 0) {
        errors.push('amountPaid must be a positive number');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
