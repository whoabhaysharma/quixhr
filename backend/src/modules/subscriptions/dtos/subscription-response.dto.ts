/**
 * Subscription details response
 */
export interface SubscriptionResponseDto {
    id: string;
    organizationId: string;
    planId: string;
    orderId: string;
    paymentId: string | null;
    amountPaid: number;
    status: string;
    startDate: Date;
    endDate: Date;
    createdAt: Date;
    plan?: {
        id: string;
        name: string;
        price: number;
        durationDays: number;
        maxEmployees: number;
    };
    organization?: {
        id: string;
        name: string;
    };
}

/**
 * Transform database Subscription model to response DTO
 */
export function toSubscriptionResponseDto(sub: {
    id: string;
    organizationId: string;
    planId: string;
    orderId: string;
    paymentId: string | null;
    amountPaid: number;
    status: string;
    startDate: Date;
    endDate: Date;
    createdAt: Date;
    plan?: {
        id: string;
        name: string;
        price: number;
        durationDays: number;
        maxEmployees: number;
    };
    organization?: {
        id: string;
        name: string;
    };
}): SubscriptionResponseDto {
    return {
        id: sub.id,
        organizationId: sub.organizationId,
        planId: sub.planId,
        orderId: sub.orderId,
        paymentId: sub.paymentId,
        amountPaid: sub.amountPaid,
        status: sub.status,
        startDate: sub.startDate,
        endDate: sub.endDate,
        createdAt: sub.createdAt,
        plan: sub.plan,
        organization: sub.organization,
    };
}
