import { emailQueue } from './email.queue';
import { QUEUE_NAMES } from './queue.names';

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
    await emailQueue.add(QUEUE_NAMES.EMAIL_NOTIFICATIONS, emailData);
};
