import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { redis } from '../infra/redis/redis.connection';
import { AUDIT_QUEUE_NAME } from '../infra/queues/audit.queue';

const prisma = new PrismaClient();


export interface AuditLogJobData {
    userId: string;
    action: string;
    resource: string;
    resourceId: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
}

export const auditWorker = new Worker(
    AUDIT_QUEUE_NAME,
    async (job: Job<AuditLogJobData>) => {
        const { userId, action, resource, resourceId, details, ipAddress, userAgent } = job.data;

        try {
            await prisma.auditLog.create({
                data: {
                    userId,
                    action,
                    resource,
                    resourceId,
                    details: details || {},
                    ipAddress,
                    userAgent
                }
            });
            // console.log(`Audit log created for action: ${action} by user: ${userId}`);
        } catch (error) {
            console.error(`Failed to process audit log job ${job.id}:`, error);
            throw error;
        }
    },
    {
        connection: redis,
        concurrency: 5, // Adjust based on load
    }
);

auditWorker.on('completed', (job) => {
    // console.log(`Audit job ${job.id} completed`);
});

auditWorker.on('failed', (job, err) => {
    console.error(`Audit job ${job?.id} failed with error ${err.message}`);
});
