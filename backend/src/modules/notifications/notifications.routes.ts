import { Router } from 'express';
import { protect, restrictTo } from '@/shared/middleware/auth.middleware';
import { Role } from '@prisma/client';
import {
    getNotificationById,
    updateNotificationStatus,
    markAsRead,
    markAsUnread,
    deleteNotification,
    markMultipleAsRead,
    markAllAsRead,
    getAllNotifications,
} from './notifications.controller';

const router = Router();

// =========================================================================
// FLAT ROUTES - /api/v1/notifications - Direct notification access by ID
// =========================================================================

/**
 * @desc    Get all notifications (Super Admin only)
 * @route   GET /api/v1/notifications
 * @access  Protected, Restricted to SUPER_ADMIN
 */
router.get(
    '/notifications',
    protect,
    restrictTo(Role.SUPER_ADMIN),
    getAllNotifications
);

/**
 * @desc    Get a single notification by ID
 * @route   GET /api/v1/notifications/:notificationId
 * @access  Protected
 */
router.get(
    '/notifications/:notificationId',
    protect,
    getNotificationById
);

/**
 * @desc    Mark multiple notifications as read
 * @route   PATCH /api/v1/notifications/mark-read
 * @access  Protected
 * @body    { notificationIds: string[] }
 */
router.patch(
    '/notifications/mark-read',
    protect,
    markMultipleAsRead
);

/**
 * @desc    Mark all user notifications as read
 * @route   PATCH /api/v1/notifications/mark-all-read
 * @access  Protected
 */
router.patch(
    '/notifications/mark-all-read',
    protect,
    markAllAsRead
);
/**
 * @desc    Mark notification as read
 * @route   PATCH /api/v1/notifications/:notificationId/read
 * @access  Protected
 */
router.patch(
    '/notifications/:notificationId/read',
    protect,
    markAsRead
);

/**
 * @desc    Mark notification as unread
 * @route   PATCH /api/v1/notifications/:notificationId/unread
 * @access  Protected
 */
router.patch(
    '/notifications/:notificationId/unread',
    protect,
    markAsUnread
);
/**
 * @desc    Update notification status (mark as read or unread)
 * @route   PATCH /api/v1/notifications/:notificationId
 * @access  Protected
 * @body    { isRead: boolean }
 */
router.patch(
    '/notifications/:notificationId',
    protect,
    updateNotificationStatus
);

/**
 * @desc    Delete a notification
 * @route   DELETE /api/v1/notifications/:notificationId
 * @access  Protected
 */
router.delete(
    '/notifications/:notificationId',
    protect,
    deleteNotification
);

export default router;
