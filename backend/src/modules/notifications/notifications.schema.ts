import { z } from 'zod';

// Query params for getting notifications
export const getNotificationsQuerySchema = z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    isRead: z.enum(['true', 'false']).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type GetNotificationsQuery = z.infer<typeof getNotificationsQuerySchema>;

// Mark as read request
export const markAsReadSchema = z.object({
    notificationIds: z.array(z.string()).min(1, 'At least one notification ID required'),
});

export type MarkAsReadInput = z.infer<typeof markAsReadSchema>;

// Response DTOs
export interface NotificationResponseDto {
    id: string;
    userId: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: Date;
}

export interface NotificationsListResponseDto {
    data: NotificationResponseDto[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
