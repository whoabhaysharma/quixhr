import prisma from './prisma';
import { Subscription } from '@prisma/client';

export const subscriptionService = {
    async getSubscriptionByOrganizationId(organizationId: string | number): Promise<Subscription | null> {
        return prisma.subscription.findFirst({
            where: { organizationId: String(organizationId) },
            include: {
                plan: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    },

    async createSubscription(data: {
        organizationId: string | number;
        planId: string;
        orderId: string;
        amountPaid: number;
        startDate: Date;
        endDate: Date;
    }): Promise<Subscription> {
        const { organizationId, ...rest } = data;
        return prisma.subscription.create({
            data: {
                ...rest,
                organizationId: String(organizationId),
            },
        });
    },

    async updateSubscriptionStatus(id: string, status: string): Promise<Subscription> {
        return prisma.subscription.update({
            where: { id },
            data: { status },
        });
    },
};
