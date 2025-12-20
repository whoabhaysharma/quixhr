import { prisma } from '../config/database';
import { calculateLeaveDays } from '../utils/dateHelper'; // Reusing existing helper if suitable or new Date() logic

export class SubscriptionService {
    async getPlans() {
        return prisma.plan.findMany();
    }

    async getSubscription(organizationId: number) {
        return prisma.subscription.findFirst({
            where: { organizationId, status: 'COMPLETED' },
            include: { plan: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async createSubscription(organizationId: number, planId: number, orderId: string, amountPaid: number, durationDays: number) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + durationDays);

        return prisma.subscription.create({
            data: {
                organizationId,
                planId,
                orderId,
                amountPaid,
                startDate,
                endDate,
                status: 'COMPLETED',
            },
        });
    }
}
