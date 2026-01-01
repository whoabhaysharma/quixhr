import { prisma } from '@/utils/prisma';
import { UpdateCompanyInput } from './company.types';

export const findById = async (id: string) => {
    return await prisma.company.findUnique({
        where: { id },
    });
};

export const update = async (id: string, data: UpdateCompanyInput) => {
    return await prisma.company.update({
        where: { id },
        data,
    });
};

export const getAuditLogs = async (companyId: string, options: { page: number, limit: number }) => {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    // Assuming there's a way to link audit logs to a company, 
    // either directly or via users belonging to the company.
    // For now, we'll fetch users of the company and then their logs.
    const users = await prisma.user.findMany({
        where: { employee: { companyId } },
        select: { id: true }
    });

    const userIds = users.map(u => u.id);

    const where = { userId: { in: userIds } };

    const [data, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { email: true, role: true } } },
            skip,
            take: limit
        }),
        prisma.auditLog.count({ where })
    ]);

    return {
        data,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
};
