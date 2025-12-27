import prisma from '../../shared/services/prisma';
import { Plan } from '@prisma/client';

export const planService = {
    async getAllPlans(): Promise<Plan[]> {
        return prisma.plan.findMany();
    },

    async getPlanById(id: string): Promise<Plan | null> {
        return prisma.plan.findUnique({
            where: { id },
        });
    },

    async createPlan(data: {
        name: string;
        price: number;
        durationDays: number;
        maxEmployees: number;
    }): Promise<Plan> {
        return prisma.plan.create({
            data,
        });
    },

    async updatePlan(id: string, data: Partial<Plan>): Promise<Plan> {
        return prisma.plan.update({
            where: { id },
            data,
        });
    },

    async deletePlan(id: string): Promise<void> {
        await prisma.plan.delete({
            where: { id },
        });
    },
};
