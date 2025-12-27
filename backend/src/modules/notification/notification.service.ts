import { PrismaClient } from '@prisma/client';
import type { CreateNotificationDto, NotificationResponseDto } from './notification.types';
import { config } from '../../config';

const prisma = new PrismaClient();

/**
 * Get user's notifications with pagination
 */
export async function getUserNotifications(
    userId: string,
    limit: number = 20,
    offset: number = 0,
    unreadOnly?: boolean
): Promise<NotificationResponseDto[]> {
    const notifications = await prisma.notification.findMany({
        where: {
            userId,
            ...(unreadOnly ? { isRead: false } : {}),
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: limit,
        skip: offset,
    });

    return notifications;
}

/**
 * Get count of unread notifications
 */
export async function getUnreadCount(userId: string): Promise<number> {
    return await prisma.notification.count({
        where: {
            userId,
            isRead: false,
        },
    });
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string, userId: string): Promise<void> {
    await prisma.notification.updateMany({
        where: {
            id: notificationId,
            userId, // Ensure user owns the notification
        },
        data: {
            isRead: true,
        },
    });
}

/**
 * Mark all user notifications as read
 */
export async function markAllAsRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
        where: {
            userId,
            isRead: false,
        },
        data: {
            isRead: true,
        },
    });
}

/**
 * Create a new notification
 */
export async function createNotification(dto: CreateNotificationDto): Promise<NotificationResponseDto> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.notification.retentionDays);

    const notification = await prisma.notification.create({
        data: {
            ...dto,
            expiresAt,
        } as any,
    });

    return notification;
}

/**
 * Delete expired notifications (TTL cleanup)
 */
export async function deleteExpiredNotifications(): Promise<number> {
    const now = new Date();

    const result = await prisma.notification.deleteMany({
        where: {
            expiresAt: {
                lt: now,
            },
        } as any,
    });

    return result.count;
}
