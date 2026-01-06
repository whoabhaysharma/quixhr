import { Queue } from 'bullmq';
import { config } from '@/config';
import { QUEUE_NAMES } from './queue.names';

const connection = {
    host: process.env.REDIS_HOST || 'redis',
    port: parseInt(process.env.REDIS_PORT || '6379'),
};

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
