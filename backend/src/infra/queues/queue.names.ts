/**
 * Queue Names
 * 
 * Centralized queue name constants for the application
 */

export const QUEUE_NAMES = {
    EMAIL_NOTIFICATIONS: 'email-notifications',
    CLEANUP_JOBS: 'cleanup-jobs',
} as const;

export type QueueName = typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES];
