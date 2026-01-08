import { Queue } from 'bullmq';
import { redis } from '../redis/redis.connection';
import { QUEUE_NAMES } from '@/constants';

export const auditQueue = new Queue(QUEUE_NAMES.AUDIT_LOGS, {
    connection: redis,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: 1000,
    },
});

export const addAuditLogJob = async (data: any) => {
    return auditQueue.add('log-action', data);
};
