import { prisma } from '@/utils/prisma';
import { AppError } from '@/utils/appError';
import { ParsedPagination } from '@/utils/pagination';
import { buildOrderBy } from '@/utils/prismaHelpers';
import { GetNotificationsQuery } from './notifications.schema';
import { Role } from '@prisma/client';
import { TokenPayload } from '@/modules/auth/auth.types';

export class NotificationService {
    /**
     * Get notifications for a specific user (Me endpoint)
     */
    /**
     * Get notifications for a specific user (Me endpoint)
     */
    static async getUserNotifications(
        userId: string,
        pagination: ParsedPagination,
        filters: Partial<GetNotificationsQuery>
    ) {
        const { page, limit, skip, sortBy, sortOrder } = pagination;
        const { isRead } = filters;

        const where: any = { userId };

        if (isRead !== undefined) {
            where.isRead = isRead === 'true';
        }

        const orderBy = buildOrderBy(sortBy, sortOrder, {
            allowedFields: ['createdAt', 'isRead'],
            defaultSort: { createdAt: 'desc' },
        });

        const [data, total] = await Promise.all([
            prisma.notification.findMany({
                where,
                orderBy: orderBy as any,
                skip,
                take: limit,
            }),
            prisma.notification.count({ where }),
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

    /**
     * Get all notifications (Super Admin endpoint)
     */
    static async getAllNotifications(
        pagination: ParsedPagination,
        filters: Partial<GetNotificationsQuery>
    ) {
        const { page, limit, skip, sortBy, sortOrder } = pagination;
        const { isRead } = filters;

        const where: any = {};

        if (isRead !== undefined) {
            where.isRead = isRead === 'true';
        }

        const orderBy = buildOrderBy(sortBy, sortOrder, {
            allowedFields: ['createdAt', 'isRead'],
            defaultSort: { createdAt: 'desc' },
        });

        const [data, total] = await Promise.all([
            prisma.notification.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            employee: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                    organizationId: true
                                },
                            },
                        },
                    },
                },
                orderBy: orderBy as any,
                skip,
                take: limit,
            }),
            prisma.notification.count({ where }),
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

    /**
     * Get all notifications for an organization (Admin endpoint)
     */
    static async getOrganizationNotifications(
        organizationId: string,
        pagination: ParsedPagination,
        filters: Partial<GetNotificationsQuery>
    ) {
        const { page, limit, skip, sortBy, sortOrder } = pagination;
        const { isRead } = filters;

        const where: any = {
            user: {
                employee: {
                    organizationId,
                },
            },
        };

        if (isRead !== undefined) {
            where.isRead = isRead === 'true';
        }

        const orderBy = buildOrderBy(sortBy, sortOrder, {
            allowedFields: ['createdAt', 'isRead'],
            defaultSort: { createdAt: 'desc' },
        });

        const [data, total] = await Promise.all([
            prisma.notification.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            employee: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                },
                            },
                        },
                    },
                },
                orderBy: orderBy as any,
                skip,
                take: limit,
            }),
            prisma.notification.count({ where }),
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

    /**
     * Get a single notification by ID (Flat endpoint)
     * Enforces RBAC:
     * - SUPER_ADMIN: Can access any notification
     * - OWNER: Can access their own notification
     * - TENANT ADMIN (ORG_ADMIN, HR_ADMIN, MANAGER): Can access notifications of employees in their organization
     */
    static async getNotificationById(notificationId: string, user: TokenPayload) {
        const notification = await prisma.notification.findUnique({
            where: { id: notificationId },
            include: {
                user: {
                    include: {
                        employee: true
                    }
                }
            }
        });

        if (!notification) {
            throw new AppError('Notification not found', 404);
        }

        // 1. Super Admin can access everything
        if (user.role === Role.SUPER_ADMIN) {
            return notification;
        }

        // 2. Owner can access their own
        if (notification.userId === user.userId) {
            return notification;
        }

        // 3. Tenant Admin checks
        const tenantAdminRoles: Role[] = [Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER];
        if (tenantAdminRoles.includes(user.role as Role)) {
            // Check if notification belongs to an employee in the same organization
            const notificationOrgId = notification.user?.employee?.organizationId;
            if (notificationOrgId === user.organizationId) {
                return notification;
            }
        }

        // If none of the above, access denied
        throw new AppError('Access denied', 403);
    }

    /**
     * Mark multiple notifications as read (batch operation)
     */
    static async markMultipleAsRead(user: TokenPayload, notificationIds: string[]) {
        const whereClause: any = {
            id: { in: notificationIds },
        };

        // RBAC Filter Logic
        const tenantAdminRoles: Role[] = [Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER];

        if (user.role === Role.SUPER_ADMIN) {
            // No additional filters needed for Super Admin
        } else if (tenantAdminRoles.includes(user.role as Role)) {
            // Tenant Admin: Own notifications OR Organization's notifications
            whereClause.OR = [
                { userId: user.userId },
                {
                    user: {
                        employee: {
                            organizationId: user.organizationId
                        }
                    }
                }
            ];
        } else {
            // Employee: Only own notifications
            whereClause.userId = user.userId;
        }

        // Find how many match the criteria (for validation/reporting, though updateMany returns count)
        // effectively updateMany will only update what matches the where clause
        const result = await prisma.notification.updateMany({
            where: whereClause,
            data: {
                isRead: true,
            },
        });

        return { updated: result.count };
    }

    /**
     * Delete a notification
     */
    static async deleteNotification(notificationId: string, user: TokenPayload) {
        // Validation via getNotificationById (Handles 404 and 403)
        await this.getNotificationById(notificationId, user);

        await prisma.notification.delete({
            where: { id: notificationId },
        });
    }

    /**
     * Update notification status (read/unread)
     */
    static async updateNotificationStatus(notificationId: string, user: TokenPayload, isRead: boolean) {
        // Validation via getNotificationById
        await this.getNotificationById(notificationId, user);

        const updated = await prisma.notification.update({
            where: { id: notificationId },
            data: { isRead },
        });

        return updated;
    }

    /**
     * Mark single notification as read
     */
    static async markAsRead(notificationId: string, user: TokenPayload) {
        return this.updateNotificationStatus(notificationId, user, true);
    }

    /**
     * Mark single notification as unread
     */
    static async markAsUnread(notificationId: string, user: TokenPayload) {
        return this.updateNotificationStatus(notificationId, user, false);
    }

    /**
     * Mark all notifications as read for a user
     * NOTE: This is specific to "My Notifications", so it acts on the user's *own* notifications.
     * If an admin wants to mark all org notifications as read, that would be a different endpoint.
     * We'll keep this strictly for the current user context.
     */
    static async markAllAsRead(userId: string) {
        const result = await prisma.notification.updateMany({
            where: {
                userId,
                isRead: false,
            },
            data: {
                isRead: true,
            },
        });

        return { updated: result.count };
    }

    /**
     * Get unread count for user
     */
    static async getUnreadCount(userId: string) {
        const count = await prisma.notification.count({
            where: {
                userId,
                isRead: false,
            },
        });

        return { unreadCount: count };
    }
}
