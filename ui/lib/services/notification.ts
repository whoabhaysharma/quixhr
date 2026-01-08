import apiClient from '../api';
import { ApiResponse, ApiError } from '@/types/api';

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
    data: Notification[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface UnreadCountResponse {
    unreadCount: number;
}

/**
 * Get user notifications
 */
export async function getNotifications(
    limit: number = 20,
    offset: number = 0,
    unreadOnly?: boolean
): Promise<ApiResponse<NotificationResponse>> {
    const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        ...(unreadOnly !== undefined ? { unreadOnly: unreadOnly.toString() } : {}),
    });

    try {
        const response = await apiClient.get<ApiResponse<NotificationResponse>>(`/me/notifications?${params}`);
        return response.data;
    } catch (error: any) {
        throw new ApiError(
            error.response?.data?.message || 'Failed to fetch notifications',
            error.response?.data?.status,
            error.response?.status
        );
    }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(): Promise<ApiResponse<UnreadCountResponse>> {
    try {
        const response = await apiClient.get<ApiResponse<UnreadCountResponse>>('/me/notifications/unread-count');
        return response.data;
    } catch (error: any) {
        throw new ApiError(
            error.response?.data?.message || 'Failed to get unread count',
            error.response?.data?.status,
            error.response?.status
        );
    }
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
    try {
        await apiClient.patch(`/notifications/${notificationId}/read`);
    } catch (error: any) {
        throw new ApiError(
            error.response?.data?.message || 'Failed to mark notification as read',
            error.response?.data?.status,
            error.response?.status
        );
    }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<void> {
    try {
        await apiClient.patch('/notifications/mark-all-read');
    } catch (error: any) {
        throw new ApiError(
            error.response?.data?.message || 'Failed to mark all notifications as read',
            error.response?.data?.status,
            error.response?.status
        );
    }
}

const notificationService = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
};

export default notificationService;
