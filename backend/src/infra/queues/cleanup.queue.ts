import { Queue } from 'bullmq';
import { redis } from '../redis/redis.connection';
import { QUEUE_NAMES } from './queue.names';
import { Logger } from '../../utils/logger';

/**
 * Cleanup Queue
 * 
 * Handles scheduled cleanup jobs like notification deletion.
 */

export const cleanupQueue = new Queue(QUEUE_NAMES.CLEANUP_JOBS, {
    connection: redis,
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

export const setupCleanupQueue = async (): Promise<void> => {
    // Schedule the notification cleanup job
    // Run every day at specific timezone or interval
    // For now, let's use the configured interval or default to daily at 3 AM

    // We use a static jobId to prevent duplicate schedules on restart
    const cleanupJobId = 'notification-cleanup-cron';

    await cleanupQueue.add(
        'clean-notifications',
        {},
        {
            repeat: {
                // Run every 2 AM
                pattern: '0 2 * * *',
            },
            jobId: cleanupJobId,
            removeOnComplete: true,
        }
    );

    // Schedule audit log cleanup
    const auditCleanupJobId = 'audit-log-cleanup-cron';
    await cleanupQueue.add(
        'clean-audit-logs',
        {},
        {
            repeat: {
                // Run every 3 AM
                pattern: '0 3 * * *',
            },
            jobId: auditCleanupJobId,
            removeOnComplete: true,
        }
    );

    Logger.info(`✅ ${QUEUE_NAMES.CLEANUP_JOBS} queue initialized with cleanup schedules.`);
};
