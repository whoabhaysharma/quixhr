import { Worker, Job } from 'bullmq';
import { QUEUE_NAMES } from '@/constants';
import { NotificationJobData } from '../infra/queues/notification.queue';
import { generateNotificationMessage } from '../constants';
import { prisma } from '../utils/prisma';
import { Logger } from '../utils/logger';
import { config } from '@/config';

const connection = config.redis;

export const notificationWorker = new Worker<NotificationJobData>(
    QUEUE_NAMES.NOTIFICATIONS,
    async (job: Job<NotificationJobData>) => {
        try {
            Logger.info(`Processing notification job ${job.id}: ${job.data.type} for user ${job.data.userId}`);

            // Generate notification message from centralized templates
            const { title, message } = generateNotificationMessage(job.data.type, job.data.data);

            // Create notification in database
            await prisma.notification.create({
                data: {
                    userId: job.data.userId,
                    title,
                    message,
                    isRead: false,
                },
            });

            Logger.info(`Notification job ${job.id} completed successfully`);
        } catch (error: any) {
            Logger.error(`Failed to process notification job ${job.id}: ${error.message}`, { stack: error.stack });
            throw error;
        }
    },
    {
        connection,
        concurrency: 5,
        limiter: {
            max: 20,
            duration: 1000
        }
    }
);

notificationWorker.on('completed', (job) => {
    Logger.debug(`Notification job ${job.id} has completed!`);
});

notificationWorker.on('failed', (job, err) => {
    Logger.error(`Notification job ${job?.id} has failed with ${err.message}`);
});
