import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';
import { AppError } from '@/utils/appError';
import { NotificationService } from './notifications.service';
import { getPaginationParams } from '@/utils/pagination';
import { getOrganizationContext } from '@/utils/tenantContext';

// =========================================================================
// ME ENDPOINTS - Current user's notifications
// =========================================================================

/**
 * @desc    Get current user's notifications
 * @route   GET /api/v1/me/notifications
 * @access  Protected
 */
export const getMyNotifications = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const userId = (req as any).user?.userId;
        if (!userId) {
            return next(new AppError('User not authenticated', 401));
        }

        const pagination = getPaginationParams(req);
        const filters = {
            isRead: req.query.isRead as 'true' | 'false' | undefined,
        };

        const result = await NotificationService.getUserNotifications(
            userId,
            pagination,
            filters
        );

        sendResponse(res, 200, result, 'Notifications retrieved successfully');
    }
);

/**
 * @desc    Get unread count for current user
 * @route   GET /api/v1/me/notifications/unread-count
 * @access  Protected
 */
export const getMyUnreadCount = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const userId = (req as any).user?.userId;
        if (!userId) {
            return next(new AppError('User not authenticated', 401));
        }

        const result = await NotificationService.getUnreadCount(userId);
        sendResponse(res, 200, result, 'Unread count retrieved successfully');
    }
);

/**
 * @desc    Mark notifications as read
 * @route   PATCH /api/v1/me/notifications/mark-read
 * @access  Protected
 */
export const markMyNotificationsAsRead = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const userId = (req as any).user?.userId;
        if (!userId) {
            return next(new AppError('User not authenticated', 401));
        }

        const { notificationIds } = req.body;
        const result = await NotificationService.markAsRead(userId, notificationIds);
        sendResponse(res, 200, result, 'Notifications marked as read');
    }
);

/**
 * @desc    Mark all notifications as read
 * @route   PATCH /api/v1/me/notifications/mark-all-read
 * @access  Protected
 */
export const markAllMyNotificationsAsRead = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const userId = (req as any).user?.userId;
        if (!userId) {
            return next(new AppError('User not authenticated', 401));
        }

        const result = await NotificationService.markAllAsRead(userId);
        sendResponse(res, 200, result, 'All notifications marked as read');
    }
);

// =========================================================================
// ORGANIZATION ENDPOINTS - Admin access to org notifications
// =========================================================================

/**
 * @desc    Get all notifications for an organization
 * @route   GET /api/v1/org/:organizationId/notifications
 * @access  Protected (Admin only)
 */
export const getOrganizationNotifications = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const organizationId = getOrganizationContext(req, next);

        const pagination = getPaginationParams(req);
        const filters = {
            isRead: req.query.isRead as 'true' | 'false' | undefined,
        };

        const result = await NotificationService.getOrganizationNotifications(
            organizationId,
            pagination,
            filters
        );

        sendResponse(res, 200, result, 'Organization notifications retrieved successfully');
    }
);

// =========================================================================
// FLAT ENDPOINTS - Direct notification access by ID
// =========================================================================

/**
 * @desc    Get a single notification by ID
 * @route   GET /api/v1/notifications/:notificationId
 * @access  Protected
 */
export const getNotificationById = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const userId = (req as any).user?.userId;
        if (!userId) {
            return next(new AppError('User not authenticated', 401));
        }

        const { notificationId } = req.params;
        const notification = await NotificationService.getNotificationById(
            notificationId,
            userId
        );

        sendResponse(res, 200, notification, 'Notification retrieved successfully');
    }
);

/**
 * @desc    Delete a notification
 * @route   DELETE /api/v1/notifications/:notificationId
 * @access  Protected
 */
export const deleteNotification = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const userId = (req as any).user?.userId;
        if (!userId) {
            return next(new AppError('User not authenticated', 401));
        }

        const { notificationId } = req.params;
        await NotificationService.deleteNotification(notificationId, userId);

        sendResponse(res, 200, null, 'Notification deleted successfully');
    }
);

/**
 * @desc    Update notification status (mark as read or unread)
 * @route   PATCH /api/v1/notifications/:notificationId
 * @access  Protected  
 */
export const updateNotificationStatus = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const userId = (req as any).user?.userId;
        if (!userId) {
            return next(new AppError('User not authenticated', 401));
        }

        const { notificationId } = req.params;
        const { isRead } = req.body;

        if (typeof isRead !== 'boolean') {
            return next(new AppError('isRead must be a boolean', 400));
        }

        const notification = await NotificationService.updateNotificationStatus(
            notificationId,
            userId,
            isRead
        );

        sendResponse(res, 200, notification, `Notification marked as ${isRead ? 'read' : 'unread'}`);
    }
);

/**
 * @desc    Mark notification as read
 * @route   PATCH /api/v1/notifications/:notificationId/read
 * @access  Protected
 */
export const markAsRead = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const userId = (req as any).user?.userId;
        if (!userId) {
            return next(new AppError('User not authenticated', 401));
        }

        const { notificationId } = req.params;
        const notification = await NotificationService.markAsRead(notificationId, userId);
        sendResponse(res, 200, notification, 'Notification marked as read');
    }
);

/**
 * @desc    Mark notification as unread
 * @route   PATCH /api/v1/notifications/:notificationId/unread
 * @access  Protected
 */
export const markAsUnread = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const userId = (req as any).user?.userId;
        if (!userId) {
            return next(new AppError('User not authenticated', 401));
        }

        const { notificationId } = req.params;
        const notification = await NotificationService.markAsUnread(notificationId, userId);
        sendResponse(res, 200, notification, 'Notification marked as unread');
    }
);

/**
 * @desc    Mark multiple notifications as read
 * @route   PATCH /api/v1/notifications/mark-read
 * @access  Protected
 */
export const markMultipleAsRead = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const userId = (req as any).user?.userId;
        if (!userId) {
            return next(new AppError('User not authenticated', 401));
        }

        const { notificationIds } = req.body;
        const result = await NotificationService.markMultipleAsRead(userId, notificationIds);
        sendResponse(res, 200, result, 'Notifications marked as read');
    }
);

/**
 * @desc    Mark all notifications as read
 * @route   PATCH /api/v1/notifications/mark-all-read
 * @access  Protected
 */
export const markAllAsRead = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const userId = (req as any).user?.userId;
        if (!userId) {
            return next(new AppError('User not authenticated', 401));
        }

        const result = await NotificationService.markAllAsRead(userId);
        sendResponse(res, 200, result, 'All notifications marked as read');
    }
);
