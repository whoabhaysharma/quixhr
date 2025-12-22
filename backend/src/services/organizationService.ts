import prisma from './prisma';
import { Organization } from '@prisma/client';

export const organizationService = {
    async getAllOrganizations(): Promise<Organization[]> {
        return prisma.organization.findMany();
    },

    async getOrganizationById(id: number): Promise<Organization | null> {
        return prisma.organization.findUnique({
            where: { id },
            include: {
                users: true,
                subscriptions: true,
            },
        });
    },

    async createOrganization(data: { name: string }): Promise<Organization> {
        return prisma.organization.create({
            data,
        });
    },

    async updateOrganization(id: number, data: { name?: string }): Promise<Organization> {
        return prisma.organization.update({
            where: { id },
            data,
        });
    },

    async deleteOrganization(id: number): Promise<void> {
        await prisma.organization.delete({
            where: { id },
        });
    },
};
