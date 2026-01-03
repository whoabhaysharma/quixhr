import { prisma } from '@/utils/prisma';
import { AppError } from '@/utils/appError';
import { ParsedPagination } from '@/utils/pagination';
import { buildOrderBy } from '@/utils/prismaHelpers';
import { GetUsersQuery } from './users.schema';

export class UserService {
    static async getUsers(
        pagination: ParsedPagination,
        filters: GetUsersQuery
    ) {
        const { page, limit, skip, sortBy, sortOrder, search } = pagination;
        const { role, email } = filters;

        const where: any = {};

        if (role) where.role = role;
        if (email || search) {
            where.email = {
                contains: email || search,
                mode: 'insensitive',
            };
        }

        const orderBy = buildOrderBy(sortBy, sortOrder, {
            allowedFields: ['email', 'role', 'createdAt'],
            defaultSort: { createdAt: 'desc' },
        });

        const [data, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: orderBy as any,
                select: {
                    id: true,
                    email: true,
                    role: true,
                    isEmailVerified: true,
                    employee: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            organizationId: true,
                        },
                    },
                },
            }),
            prisma.user.count({ where }),
        ]);

        return {
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    static async getUserById(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                role: true,
                isEmailVerified: true,
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        organizationId: true,
                        status: true,
                    },
                },
            },
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        return user;
    }
}
