import { Queue } from 'bullmq';
import { config } from '@/config';
import { QUEUE_NAMES } from '@/constants';
import { Logger } from '@/utils/logger';
import { NotificationType } from '../../constants';

// =========================================================================
// QUEUE DEFINITION
// =========================================================================

const connection = config.redis;

export const notificationQueue = new Queue(QUEUE_NAMES.NOTIFICATIONS, {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
    },
});

// =========================================================================
// PRODUCER FUNCTIONS
// =========================================================================

export interface NotificationJobData {
    userId: string;
    type: NotificationType;
    data: Record<string, any>;
}

/**
 * Add a notification job to the queue
 */
export const addNotificationToQueue = async (
    userId: string,
    type: NotificationType,
    data: Record<string, any>
) => {
    try {
        const jobData: NotificationJobData = {
            userId,
            type,
            data,
        };

        await notificationQueue.add(QUEUE_NAMES.NOTIFICATIONS, jobData);
        Logger.info(`Queued notification: ${type} for user ${userId}`);
    } catch (error: any) {
        Logger.error(`Failed to queue notification for user ${userId}: ${error.message}`);
        throw error;
    }
};
