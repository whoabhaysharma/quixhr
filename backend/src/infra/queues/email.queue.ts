import { Queue } from 'bullmq';
import { config } from '@/config';
import { QUEUE_NAMES } from './queue.names';

const connection = config.redis;

export const emailQueue = new Queue(QUEUE_NAMES.EMAIL_NOTIFICATIONS, {
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
