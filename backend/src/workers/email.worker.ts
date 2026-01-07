import { Worker, Job } from 'bullmq';
import { QUEUE_NAMES } from '../infra/queues/queue.names';
import { sendEmail } from '../infra/email/email.service';
import { EmailJobData } from '../infra/queues/email.producer';
import { Logger } from '../utils/logger';

import { config } from '@/config';

const connection = config.redis;

export const emailWorker = new Worker<EmailJobData>(
    QUEUE_NAMES.EMAIL_NOTIFICATIONS,
    async (job: Job<EmailJobData>) => {
        try {
            Logger.info(`Processing email job ${job.id}: ${job.data.template} to ${job.data.to}`);
            await sendEmail(job.data);
            Logger.info(`Email job ${job.id} completed successfully`);
        } catch (error: any) {
            Logger.error(`Failed to process email job ${job.id}: ${error.message}`, { stack: error.stack });
            throw error;
        }
    },
    {
        connection,
        concurrency: 5, // Process up to 5 emails concurrently
        limiter: {
            max: 10,      // Max 10 jobs
            duration: 1000 // Per 1 second
        }
    }
);

emailWorker.on('completed', (job) => {
    Logger.debug(`Job ${job.id} has completed!`);
});

emailWorker.on('failed', (job, err) => {
    Logger.error(`Job ${job?.id} has failed with ${err.message}`);
});
