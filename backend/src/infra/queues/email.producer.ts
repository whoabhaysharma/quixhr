import { emailQueue } from './email.queue';
import { QUEUE_NAMES } from './queue.names';
import { Logger } from '../../utils/logger';

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
