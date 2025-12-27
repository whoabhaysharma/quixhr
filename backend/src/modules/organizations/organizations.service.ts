import prisma from '../../shared/services/prisma';
import { Organization } from '@prisma/client';

export const organizationService = {
    async getAllOrganizations(): Promise<Organization[]> {
        return prisma.organization.findMany();
    },

    async getOrganizationById(id: string): Promise<Organization | null> {
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

    async updateOrganization(id: string, data: { name?: string }): Promise<Organization> {
        return prisma.organization.update({
            where: { id },
            data,
        });
    },

    async deleteOrganization(id: string): Promise<void> {
        await prisma.organization.delete({
            where: { id },
        });
    },
};
