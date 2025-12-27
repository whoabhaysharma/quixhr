import { Worker, Job, WorkerOptions } from 'bullmq';
import { redis } from '../redis/redis.connection';
import { sendEmail } from '../../modules/notification/email.service';
import { EmailPayload } from '../../modules/notification/notification.types';
import { QUEUE_NAMES } from '../queues/queue.names';

/**
 * Email job processor
 */
export const processEmailJob = async (job: Job<EmailPayload>): Promise<void> => {
    console.log(`📧 Processing email job ${job.id} to ${job.data.to}`);

    try {
        await sendEmail(job.data);
        console.log(`✅ Email job ${job.id} completed`);
    } catch (error) {
        console.error(`❌ Email job ${job.id} failed:`, error);
        throw error; // Will trigger retry
    }
};

/**
 * Worker options
 */
const workerOptions: WorkerOptions = {
    connection: redis,
    concurrency: 5, // Process 5 emails concurrently
};

/**
 * Create and configure email worker
 */
export const createEmailWorker = (): Worker<EmailPayload> => {
    const worker = new Worker<EmailPayload>(
        QUEUE_NAMES.EMAIL_NOTIFICATIONS,
        processEmailJob,
        workerOptions
    );

    // Event listeners
    worker.on('completed', (job) => {
        console.log(`✅ Job ${job.id} completed successfully`);
    });

    worker.on('failed', (job, err) => {
        console.error(`❌ Job ${job?.id} failed:`, err.message);
    });

    worker.on('error', (err) => {
        console.error('❌ Worker error:', err);
    });

    console.log('🚀 Email notification worker started');

    return worker;
};
