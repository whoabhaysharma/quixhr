import { prisma } from '../config/database';

export class OrganizationService {
    async getOrganizationById(id: number) {
        return prisma.organization.findUnique({
            where: { id },
        });
    }

    async updateOrganization(id: number, data: { name?: string }) {
        return prisma.organization.update({
            where: { id },
            data,
        });
    }

    // Create is handled via Auth/Register, but we can add administrative create if needed later.
}
