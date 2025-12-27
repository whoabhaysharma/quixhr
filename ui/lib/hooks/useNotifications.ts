import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import notificationService, { type Notification } from '../services/notification';

/**
 * Hook to fetch user notifications
 */
export function useNotifications(limit: number = 20, offset: number = 0, unreadOnly?: boolean) {
    return useQuery({
        queryKey: ['notifications', limit, offset, unreadOnly],
        queryFn: () => notificationService.getNotifications(limit, offset, unreadOnly),
        refetchInterval: 30000, // Refetch every 30 seconds
        retry: false, // Don't retry on auth errors
        staleTime: 10000, // Consider data stale after 10 seconds
    });
}

/**
 * Hook to get unread notification count
 */
export function useUnreadCount() {
    return useQuery({
        queryKey: ['notifications', 'unread-count'],
        queryFn: () => notificationService.getUnreadCount(),
        refetchInterval: 30000, // Refetch every 30 seconds
        retry: false, // Don't retry on auth errors
        staleTime: 10000, // Consider data stale after 10 seconds
    });
}

/**
 * Hook to mark notification as read
 */
export function useMarkAsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (notificationId: string) => notificationService.markAsRead(notificationId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
}

/**
 * Hook to mark all notifications as read
 */
export function useMarkAllAsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => notificationService.markAllAsRead(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
}
