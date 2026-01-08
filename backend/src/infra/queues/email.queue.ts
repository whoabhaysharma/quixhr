import { Queue } from 'bullmq';
import { config } from '@/config';
import { QUEUE_NAMES } from '@/constants';
import { Logger } from '../../utils/logger';

// =========================================================================
// QUEUE DEFINITION
// =========================================================================

const connection = config.redis;

export const emailQueue = new Queue(QUEUE_NAMES.EMAIL_NOTIFICATIONS, {
    connection,
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

// =========================================================================
// PRODUCER FUNCTIONS
// =========================================================================

export interface EmailJobData {
    to: string;
    subject: string;
    template: string;
    data?: Record<string, any>;
}

/**
 * Add an email job to the queue
 */
export const addEmailToQueue = async (emailData: EmailJobData) => {
    try {
        await emailQueue.add(QUEUE_NAMES.EMAIL_NOTIFICATIONS, emailData);
        Logger.info(`Queued email: ${emailData.template} to ${emailData.to}`);
    } catch (error: any) {
        Logger.error(`Failed to queue email to ${emailData.to}: ${error.message}`);
        throw error;
    }
};

/**
 * Add multiple email jobs to the queue (same template, different recipients)
 */
export const addMultipleEmailsToQueue = async (
    recipients: string[],
    subject: string,
    template: string,
    data?: Record<string, any>
) => {
    try {
        const emailJobs = recipients.map(recipient => ({
            to: recipient,
            subject,
            template,
            data,
        }));

        // Queue all emails in parallel
        await Promise.all(emailJobs.map(emailData => addEmailToQueue(emailData)));
        Logger.info(`Queued ${recipients.length} emails: ${template} to multiple recipients`);
    } catch (error: any) {
        Logger.error(`Failed to queue emails: ${error.message}`);
        throw error;
    }
};
