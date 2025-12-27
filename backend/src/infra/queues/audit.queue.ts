import { Queue } from 'bullmq';
import { redis } from '../redis/redis.connection';

export const AUDIT_QUEUE_NAME = 'audit-queue';

export const auditQueue = new Queue(AUDIT_QUEUE_NAME, {
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
