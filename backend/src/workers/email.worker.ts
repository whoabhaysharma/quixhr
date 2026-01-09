import { Worker, Job } from 'bullmq';
import { QUEUE_NAMES } from '@/constants';
import { sendEmail } from '../infra/email/email.service';
import { EmailJobData } from '../infra/queues/email.queue';
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
            // Check for permanent errors where we should NOT retry
            // e.g. Invalid URI, Invalid Parameter, MessageRejected (blocked address)
            const permanentErrors = [
                'InvalidParameterValue',
                'MessageRejected',
                'MailFromDomainNotVerified',
                'ConfigurationSetDoesNotExist'
            ];

            // If it's a permanent error, log it but don't throw (so Queue marks it as completed/failed without retry loop)
            if (error.Code && permanentErrors.includes(error.Code) || error.message?.includes('Address blacklisted')) {
                Logger.error(`Permanent failure for email job ${job.id}: ${error.message} - OFFBOARDING JOB`);
                return; // Treat as success to remove from queue/stop retrying
            }

            Logger.error(`Failed to process email job ${job.id}: ${error.message}`, { stack: error.stack });
            throw error; // Throw for transient errors to trigger retry
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
