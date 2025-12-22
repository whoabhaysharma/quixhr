import prisma from './prisma';
import { Subscription } from '@prisma/client';

export const subscriptionService = {
    async getSubscriptionByOrganizationId(organizationId: number): Promise<Subscription | null> {
        return prisma.subscription.findFirst({
            where: { organizationId },
            include: {
                plan: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    },

    async createSubscription(data: {
        organizationId: number;
        planId: number;
        orderId: string;
        amountPaid: number;
        startDate: Date;
        endDate: Date;
    }): Promise<Subscription> {
        return prisma.subscription.create({
            data,
        });
    },

    async updateSubscriptionStatus(id: number, status: string): Promise<Subscription> {
        return prisma.subscription.update({
            where: { id },
            data: { status },
        });
    },
};
