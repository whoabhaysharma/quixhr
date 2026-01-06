import { Worker, Job } from 'bullmq';
import { QUEUE_NAMES } from '../infra/queues/queue.names';
import { sendEmail } from '../infra/email/email.service';
import { EmailJobData } from '../infra/queues/email.producer';

const connection = {
    host: process.env.REDIS_HOST || 'redis',
    port: parseInt(process.env.REDIS_PORT || '6379'),
};

export const emailWorker = new Worker<EmailJobData>(
    QUEUE_NAMES.EMAIL_NOTIFICATIONS,
    async (job: Job<EmailJobData>) => {
        console.log(`Processing email job ${job.id} for ${job.data.to}`);
        await sendEmail(job.data);
        console.log(`Email job ${job.id} completed`);
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
    console.log(`Job ${job.id} has completed!`);
});

emailWorker.on('failed', (job, err) => {
    console.log(`Job ${job?.id} has failed with ${err.message}`);
});
