/**
 * Subscription plan details response
 */
export interface PlanResponseDto {
    id: string;
    name: string;
    price: number;
    durationDays: number;
    maxEmployees: number;
}

/**
 * Transform database Plan model to response DTO
 */
export function toPlanResponseDto(plan: {
    id: string;
    name: string;
    price: number;
    durationDays: number;
    maxEmployees: number;
}): PlanResponseDto {
    return {
        id: plan.id,
        name: plan.name,
        price: plan.price,
        durationDays: plan.durationDays,
        maxEmployees: plan.maxEmployees,
    };
}
