import { Queue, QueueOptions } from 'bullmq';
import { redis } from '../redis/redis.connection';
import { EmailPayload } from '../../modules/notification/notification.types';
import { QUEUE_NAMES } from './queue.names';

/**
 * Email queue configuration
 */
const emailQueueOptions: QueueOptions = {
    connection: redis,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
        removeOnComplete: {
            age: 24 * 3600, // 24 hours
            count: 1000,
        },
        removeOnFail: {
            age: 7 * 24 * 3600, // 7 days
        },
    },
};

/**
 * Email queue instance
 */
export const emailQueue = new Queue<EmailPayload>(
    QUEUE_NAMES.EMAIL_NOTIFICATIONS,
    emailQueueOptions
);

console.log(`✅ Email queue '${QUEUE_NAMES.EMAIL_NOTIFICATIONS}' initialized`);

