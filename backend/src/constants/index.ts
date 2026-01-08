/**
 * Infrastructure Constants
 * 
 * Centralized exports for all constants used across the application
 */

// Notification constants
export {
    NotificationType,
    NotificationMessage,
    LeaveRequestCreatedData,
    LeaveRequestStatusData,
    InvitationReceivedData,
    InvitationAcceptedData,
    generateNotificationMessage,
} from './notifications';

// Queue constants
export * from './queues';
