import prisma from '../../utils/prisma';

export class AdminService {
    static async getPlatformDashboard() {
        // 1. Growth Metrics (New Organizations this week)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const [
            totalOrganizations,
            activeSubscriptions,
            totalUsers,
            newOrganizationsThisWeek,
            revenueData
        ] = await Promise.all([
            prisma.organization.count(),
            (prisma as any).subscription.count({ where: { status: 'ACTIVE' } }),
            prisma.user.count(),
            prisma.organization.count({
                where: { createdAt: { gte: oneWeekAgo } }
            }),
            // Assuming we have some way to track price, for now let's mock MRR 
            // from some logic or if we had price field in Subscriptions.
            // For now, let's assume a flat $50/sub if not specified.
            (prisma as any).subscription.findMany({
                where: { status: 'ACTIVE' },
                select: { id: true }
            })
        ]);

        // Mock MRR calculation for now
        const mrr = revenueData.length * 50;

        return {
            metrics: {
                mrr,
                churn: 2, // Mocked for now
                totalTenants: totalOrganizations,
                totalUsers,
                activeSubs: activeSubscriptions,
                newTenantsThisWeek: newOrganizationsThisWeek
            },
            systemHealth: "Good",
            serverLoad: "Low"
        };
    }
}
