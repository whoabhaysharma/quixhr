import apiClient from '../api';

export interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
    isRead: boolean;
    actionUrl: string | null;
    createdAt: string;
}

export interface NotificationResponse {
    success: boolean;
    data: Notification[];
}

export interface UnreadCountResponse {
    success: boolean;
    data: { count: number };
}

/**
 * Get user notifications
 */
export async function getNotifications(
    limit: number = 20,
    offset: number = 0,
    unreadOnly?: boolean
): Promise<NotificationResponse> {
    const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        ...(unreadOnly !== undefined ? { unreadOnly: unreadOnly.toString() } : {}),
    });

    const response = await apiClient.get(`/notifications?${params}`);
    return response.data;
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(): Promise<UnreadCountResponse> {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data;
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
    await apiClient.patch(`/notifications/${notificationId}/read`);
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<void> {
    await apiClient.patch('/notifications/mark-all-read');
}

const notificationService = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
};

export default notificationService;
