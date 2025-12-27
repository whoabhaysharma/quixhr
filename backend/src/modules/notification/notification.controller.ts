import { Response } from 'express';
import { authMiddleware, AuthRequest } from '../../shared/middleware/auth.middleware';
import * as notificationService from './notification.service';
import { getNotificationsQuerySchema } from './notification.types';
import { Router } from 'express';

const router = Router();

/**
 * GET /notifications
 * Get user's notifications
 */
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const query = getNotificationsQuerySchema.parse(req.query);

        const notifications = await notificationService.getUserNotifications(
            userId,
            query.limit,
            query.offset,
            query.unreadOnly
        );

        res.json({
            success: true,
            data: notifications,
        });
    } catch (error: any) {
        console.error('Get notifications error:', error);
        res.status(400).json({
            success: false,
            error: error.message || 'Failed to fetch notifications',
        });
    }
});

/**
 * GET /notifications/unread-count
 * Get count of unread notifications
 */
router.get('/unread-count', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const count = await notificationService.getUnreadCount(userId);

        res.json({
            success: true,
            data: { count },
        });
    } catch (error: any) {
        console.error('Get unread count error:', error);
        res.status(400).json({
            success: false,
            error: error.message || 'Failed to get unread count',
        });
    }
});

/**
 * PATCH /notifications/:id/read
 * Mark notification as read
 */
router.patch('/:id/read', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const notificationId = req.params.id;

        await notificationService.markAsRead(notificationId, userId);

        res.json({
            success: true,
            message: 'Notification marked as read',
        });
    } catch (error: any) {
        console.error('Mark as read error:', error);
        res.status(400).json({
            success: false,
            error: error.message || 'Failed to mark notification as read',
        });
    }
});

/**
 * PATCH /notifications/mark-all-read
 * Mark all notifications as read
 */
router.patch('/mark-all-read', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        await notificationService.markAllAsRead(userId);

        res.json({
            success: true,
            message: 'All notifications marked as read',
        });
    } catch (error: any) {
        console.error('Mark all as read error:', error);
        res.status(400).json({
            success: false,
            error: error.message || 'Failed to mark all notifications as read',
        });
    }
});

export default router;
