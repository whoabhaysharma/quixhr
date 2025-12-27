import { z } from 'zod';

// Enums
export const NotificationType = z.enum(['INFO', 'SUCCESS', 'WARNING', 'ERROR']);
export type NotificationType = z.infer<typeof NotificationType>;

// Create Notification DTO
export const createNotificationSchema = z.object({
    userId: z.string().uuid(),
    title: z.string().min(1).max(200),
    message: z.string().min(1).max(1000),
    type: NotificationType.default('INFO'),
    actionUrl: z.string().url().optional(),
});

export type CreateNotificationDto = z.infer<typeof createNotificationSchema>;

// Notification Response
export interface NotificationResponseDto {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    actionUrl: string | null;
    createdAt: Date;
}

// Query params
export const getNotificationsQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(50).default(20),
    offset: z.coerce.number().int().min(0).default(0),
    unreadOnly: z.coerce.boolean().optional(),
});

export type GetNotificationsQuery = z.infer<typeof getNotificationsQuerySchema>;

// Email Templates Enum
export enum EmailTemplate {
    WELCOME = 'welcome',
    RESET_PASSWORD = 'reset-password',
    LOGIN_ALERT = 'login-alert',
    LEAVE_APPROVED = 'leave-approved',
    LEAVE_REJECTED = 'leave-rejected',
    ATTENDANCE_REMINDER = 'attendance-reminder',
    EMAIL_VERIFICATION = 'email-verification',
}

// Email Payload Interface
export interface EmailPayload {
    to: string;
    subject: string;
    template: EmailTemplate | string;
    data: Record<string, any>;
}
