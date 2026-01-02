import { prisma } from '@/utils/prisma';
import { Role } from '@prisma/client';

export const findAll = async (params: {
    page: number;
    limit: number;
    search?: string;
    role?: Role;
}) => {
    const { page, limit, search, role } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (role) {
        where.role = role;
    }

    if (search) {
        where.OR = [
            { email: { contains: search, mode: 'insensitive' } },
            {
                employee: {
                    OR: [
                        { firstName: { contains: search, mode: 'insensitive' } },
                        { lastName: { contains: search, mode: 'insensitive' } }
                    ]
                }
            }
        ];
    }

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            select: {
                id: true,
                email: true,
                role: true,
                isEmailVerified: true,
                lastPasswordResetRequest: true,
                employee: {
                    select: {
                        firstName: true,
                        lastName: true,
                        status: true
                    }
                },
                auditLogs: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                    select: { createdAt: true } // Last active approximate
                }
            },
            skip,
            take: limit,
            orderBy: { email: 'asc' },
        }),
        prisma.user.count({ where }),
    ]);

    return {
        users,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
};
