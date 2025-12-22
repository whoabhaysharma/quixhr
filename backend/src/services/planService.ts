import prisma from './prisma';
import { Plan } from '@prisma/client';

export const planService = {
    async getAllPlans(): Promise<Plan[]> {
        return prisma.plan.findMany();
    },

    async getPlanById(id: number): Promise<Plan | null> {
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

    async updatePlan(id: number, data: Partial<Plan>): Promise<Plan> {
        return prisma.plan.update({
            where: { id },
            data,
        });
    },

    async deletePlan(id: number): Promise<void> {
        await prisma.plan.delete({
            where: { id },
        });
    },
};
