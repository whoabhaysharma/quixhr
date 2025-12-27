/**
 * Organization details response
 */
export interface OrganizationResponseDto {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    memberCount?: number;
    activeSubscription?: {
        id: string;
        planName: string;
        endDate: Date;
        status: string;
    };
}

/**
 * Transform database Organization model to response DTO
 */
export function toOrganizationResponseDto(org: {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    _count?: { users: number };
    subscriptions?: Array<{
        id: string;
        endDate: Date;
        status: string;
        plan: { name: string };
    }>;
}): OrganizationResponseDto {
    const response: OrganizationResponseDto = {
        id: org.id,
        name: org.name,
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
    };

    // Add member count if available
    if (org._count?.users !== undefined) {
        response.memberCount = org._count.users;
    }

    // Add active subscription if available
    if (org.subscriptions && org.subscriptions.length > 0) {
        const activeSub = org.subscriptions.find(s => new Date(s.endDate) > new Date());
        if (activeSub) {
            response.activeSubscription = {
                id: activeSub.id,
                planName: activeSub.plan.name,
                endDate: activeSub.endDate,
                status: activeSub.status,
            };
        }
    }

    return response;
}
