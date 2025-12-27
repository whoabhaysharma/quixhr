import { Worker, Job } from 'bullmq';
import { redis } from '../redis/redis.connection';
import { QUEUE_NAMES } from '../queues/queue.names';
import { deleteExpiredNotifications } from '../../modules/notification/notification.service';

/**
 * Cleanup Worker
 * 
 * Processes background cleanup tasks.
 */

export const setupCleanupWorker = (): void => {
    const worker = new Worker(
        QUEUE_NAMES.CLEANUP_JOBS,
        async (job: Job) => {
            console.log(`[Cleanup Worker] Processing job ${job.name} (ID: ${job.id})`);

            switch (job.name) {
                case 'clean-notifications':
                    const count = await deleteExpiredNotifications();
                    if (count > 0) {
                        console.log(`[Cleanup Worker] Deleted ${count} expired notifications`);
                    }
                    return { deletedCount: count };

                case 'clean-audit-logs':
                    const { config } = await import('../../config');
                    const { deleteOldAuditLogs } = await import('../../modules/audit/audit.service');
                    const auditCount = await deleteOldAuditLogs(config.audit.retentionDays);
                    if (auditCount > 0) {
                        console.log(`[Cleanup Worker] Deleted ${auditCount} old audit logs`);
                    }
                    return { deletedCount: auditCount };

                default:
                    console.warn(`[Cleanup Worker] Unknown job name: ${job.name}`);
            }
        },
        {
            connection: redis,
            concurrency: 1, // Run sequentially
        }
    );

    worker.on('completed', (job) => {
        // console.log(`[Cleanup Worker] Job ${job.name} completed`);
    });

    worker.on('failed', (job, err) => {
        console.error(`[Cleanup Worker] Job ${job?.name} failed:`, err);
    });

    console.log(`👷 Cleanup worker started for queue: ${QUEUE_NAMES.CLEANUP_JOBS}`);
};
