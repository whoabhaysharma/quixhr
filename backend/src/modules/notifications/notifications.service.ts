import { prisma } from '@/utils/prisma';
import { AppError } from '@/utils/appError';
import { ParsedPagination } from '@/utils/pagination';
import { buildOrderBy } from '@/utils/prismaHelpers';
import { GetNotificationsQuery } from './notifications.schema';

export class NotificationService {
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
     */
    static async getNotificationById(notificationId: string, userId: string) {
        const notification = await prisma.notification.findUnique({
            where: { id: notificationId },
        });

        if (!notification) {
            throw new AppError('Notification not found', 404);
        }

        // Ensure user can only access their own notifications
        if (notification.userId !== userId) {
            throw new AppError('Access denied', 403);
        }

        return notification;
    }

    /**
     * Mark multiple notifications as read (batch operation)
     */
    static async markMultipleAsRead(userId: string, notificationIds: string[]) {
        // Verify all notifications belong to the user
        const notifications = await prisma.notification.findMany({
            where: {
                id: { in: notificationIds },
            },
        });

        const invalidIds = notifications.filter(n => n.userId !== userId);
        if (invalidIds.length > 0) {
            throw new AppError('Some notifications do not belong to you', 403);
        }

        await prisma.notification.updateMany({
            where: {
                id: { in: notificationIds },
                userId,
            },
            data: {
                isRead: true,
            },
        });

        return { updated: notificationIds.length };
    }

    /**
     * Delete a notification
     */
    static async deleteNotification(notificationId: string, userId: string) {
        const notification = await this.getNotificationById(notificationId, userId);

        await prisma.notification.delete({
            where: { id: notificationId },
        });
    }

    /**
     * Update notification status (read/unread)
     */
    static async updateNotificationStatus(notificationId: string, userId: string, isRead: boolean) {
        const notification = await this.getNotificationById(notificationId, userId);

        const updated = await prisma.notification.update({
            where: { id: notificationId },
            data: { isRead },
        });

        return updated;
    }

    /**
     * Mark single notification as read
     */
    static async markAsRead(notificationId: string, userId: string) {
        return this.updateNotificationStatus(notificationId, userId, true);
    }

    /**
     * Mark single notification as unread
     */
    static async markAsUnread(notificationId: string, userId: string) {
        return this.updateNotificationStatus(notificationId, userId, false);
    }

    /**
     * Mark all notifications as read for a user
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
