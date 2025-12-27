import { createNotification } from './notification.service';
import { NotificationEvent } from './notification.events';
import { getNotificationMessage } from './notification.messages';
import { NotificationType } from './notification.types';

/**
 * Notification Helper Utilities
 * 
 * High-level functions to create notifications for various events
 */

interface CreateNotificationOptions {
    userId: string;
    event: NotificationEvent;
    data: any;
}

/**
 * Create a notification for a specific event
 */
export async function createEventNotification(
    options: CreateNotificationOptions
): Promise<void> {
    try {
        const { userId, event, data } = options;
        const message = getNotificationMessage(event, data);

        await createNotification({
            userId,
            title: message.title,
            message: message.message,
            type: message.type,
            actionUrl: message.actionUrl,
        });

        console.log(`✅ Notification created for user ${userId}: ${event}`);
    } catch (error) {
        console.error('Failed to create notification:', error);
        // Don't throw - notifications should not break the main flow
    }
}

/**
 * Create notifications for multiple users
 */
export async function createBulkNotifications(
    userIds: string[],
    event: NotificationEvent,
    data: any
): Promise<void> {
    try {
        const message = getNotificationMessage(event, data);

        const promises = userIds.map(userId =>
            createNotification({
                userId,
                title: message.title,
                message: message.message,
                type: message.type,
                actionUrl: message.actionUrl,
            }).catch(err => {
                console.error(`Failed to create notification for user ${userId}:`, err);
                // Continue with other users even if one fails
            })
        );

        await Promise.all(promises);
        console.log(`✅ Bulk notifications created for ${userIds.length} users: ${event}`);
    } catch (error) {
        console.error('Failed to create bulk notifications:', error);
    }
}

/**
 * Create a custom notification (not tied to a specific event)
 */
export async function createCustomNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType = 'INFO',
    actionUrl?: string
): Promise<void> {
    try {
        await createNotification({
            userId,
            title,
            message,
            type,
            actionUrl,
        });

        console.log(`✅ Custom notification created for user ${userId}`);
    } catch (error) {
        console.error('Failed to create custom notification:', error);
    }
}

/**
 * Auth-related notification helpers
 */
export const notifyAuth = {
    registered: async (userId: string, name: string) => {
        await createEventNotification({
            userId,
            event: NotificationEvent.USER_REGISTERED,
            data: { name },
        });
    },

    emailVerified: async (userId: string, name: string) => {
        await createEventNotification({
            userId,
            event: NotificationEvent.EMAIL_VERIFIED,
            data: { name },
        });
    },

    passwordReset: async (userId: string) => {
        await createEventNotification({
            userId,
            event: NotificationEvent.PASSWORD_RESET,
            data: {},
        });
    },

    loginAlert: async (userId: string, ipAddress: string) => {
        await createEventNotification({
            userId,
            event: NotificationEvent.LOGIN_ALERT,
            data: { ipAddress, timestamp: new Date() },
        });
    },
};

/**
 * Attendance-related notification helpers
 */
export const notifyAttendance = {
    checkedIn: async (userId: string, timestamp: Date) => {
        await createEventNotification({
            userId,
            event: NotificationEvent.ATTENDANCE_CHECKED_IN,
            data: { timestamp },
        });
    },

    checkedOut: async (userId: string, checkInTime: Date, checkOutTime: Date, hoursWorked: number) => {
        await createEventNotification({
            userId,
            event: NotificationEvent.ATTENDANCE_CHECKED_OUT,
            data: { checkInTime, checkOutTime, hoursWorked },
        });
    },

    lateCheckIn: async (userId: string, timestamp: Date, expectedTime: string) => {
        await createEventNotification({
            userId,
            event: NotificationEvent.ATTENDANCE_LATE,
            data: { timestamp, expectedTime },
        });
    },

    missingAttendance: async (userId: string, date: Date) => {
        await createEventNotification({
            userId,
            event: NotificationEvent.ATTENDANCE_MISSING,
            data: { date },
        });
    },
};

/**
 * Employee-related notification helpers
 */
export const notifyEmployee = {
    added: async (userId: string, name: string, companyName: string) => {
        await createEventNotification({
            userId,
            event: NotificationEvent.EMPLOYEE_ADDED,
            data: { name, companyName },
        });
    },

    statusChanged: async (userId: string, newStatus: string) => {
        await createEventNotification({
            userId,
            event: NotificationEvent.EMPLOYEE_STATUS_CHANGED,
            data: { newStatus },
        });
    },

    profileUpdated: async (userId: string) => {
        await createEventNotification({
            userId,
            event: NotificationEvent.EMPLOYEE_PROFILE_UPDATED,
            data: {},
        });
    },

    roleChanged: async (userId: string, newRole: string) => {
        await createEventNotification({
            userId,
            event: NotificationEvent.EMPLOYEE_ROLE_CHANGED,
            data: { newRole },
        });
    },
};

/**
 * Company-related notification helpers
 */
export const notifyCompany = {
    created: async (userId: string, companyName: string) => {
        await createEventNotification({
            userId,
            event: NotificationEvent.COMPANY_CREATED,
            data: { companyName },
        });
    },

    settingsUpdated: async (userIds: string[], updatedBy: string) => {
        await createBulkNotifications(
            userIds,
            NotificationEvent.COMPANY_SETTINGS_UPDATED,
            { updatedBy }
        );
    },

    memberJoined: async (userIds: string[], memberName: string, role: string) => {
        await createBulkNotifications(
            userIds,
            NotificationEvent.COMPANY_MEMBER_JOINED,
            { memberName, role }
        );
    },
};

/**
 * Calendar-related notification helpers
 */
export const notifyCalendar = {
    holidayAdded: async (userIds: string[], holidayName: string, date: Date) => {
        await createBulkNotifications(
            userIds,
            NotificationEvent.HOLIDAY_ADDED,
            { holidayName, date }
        );
    },

    holidayUpdated: async (userIds: string[], holidayName: string, newDate: Date) => {
        await createBulkNotifications(
            userIds,
            NotificationEvent.HOLIDAY_UPDATED,
            { holidayName, newDate }
        );
    },

    holidayDeleted: async (userIds: string[], holidayName: string) => {
        await createBulkNotifications(
            userIds,
            NotificationEvent.HOLIDAY_DELETED,
            { holidayName }
        );
    },

    holidayUpcoming: async (userIds: string[], holidayName: string, date: Date, daysUntil: number) => {
        await createBulkNotifications(
            userIds,
            NotificationEvent.HOLIDAY_UPCOMING,
            { holidayName, date, daysUntil }
        );
    },
};

/**
 * Leave-related notification helpers (Future)
 */
export const notifyLeave = {
    requested: async (userId: string, startDate: Date, endDate: Date, days: number) => {
        await createEventNotification({
            userId,
            event: NotificationEvent.LEAVE_REQUESTED,
            data: { startDate, endDate, days },
        });
    },

    approved: async (userId: string, startDate: Date, endDate: Date, approvedBy: string) => {
        await createEventNotification({
            userId,
            event: NotificationEvent.LEAVE_APPROVED,
            data: { startDate, endDate, approvedBy },
        });
    },

    rejected: async (userId: string, startDate: Date, endDate: Date, rejectedBy: string, reason?: string) => {
        await createEventNotification({
            userId,
            event: NotificationEvent.LEAVE_REJECTED,
            data: { startDate, endDate, rejectedBy, reason },
        });
    },

    cancelled: async (userId: string, startDate: Date, endDate: Date) => {
        await createEventNotification({
            userId,
            event: NotificationEvent.LEAVE_CANCELLED,
            data: { startDate, endDate },
        });
    },
};
