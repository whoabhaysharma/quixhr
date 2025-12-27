import { emailQueue } from '../../infra/queues/email.queue';
import { QUEUE_NAMES } from '../../infra/queues/queue.names';
import { EmailPayload } from './notification.types';
import { config } from '../../config';

/**
 * Queue an email notification
 */
export const queueEmail = async (
    payload: EmailPayload,
    priority?: number
): Promise<void> => {
    await emailQueue.add('send-email', payload, {
        priority: priority || 0,
    });

    console.log(`📬 Email queued for ${payload.to}`);
};

/**
 * Queue password reset email
 */
export const queuePasswordResetEmail = async (
    to: string,
    resetToken: string
): Promise<void> => {
    const resetUrl = `${config.frontend.url}/reset-password?token=${resetToken}`;

    await queueEmail({
        to,
        subject: 'Reset Your Password',
        template: 'reset-password' as any,
        data: {
            resetUrl,
            expiresIn: '1 hour',
        },
    }, 10); // High priority
};

/**
 * Queue welcome email
 */
export const queueWelcomeEmail = async (
    to: string,
    name: string
): Promise<void> => {
    await queueEmail({
        to,
        subject: 'Welcome to QuixHR',
        template: 'welcome' as any,
        data: {
            name,
            loginUrl: `${config.frontend.url}/login`,
        },
    });
};

/**
 * Queue login alert
 */
export const queueLoginAlert = async (
    to: string,
    name: string,
    ipAddress: string
): Promise<void> => {
    await queueEmail({
        to,
        subject: 'New Login Detected',
        template: 'login-alert' as any,
        data: {
            name,
            ipAddress,
            timestamp: new Date().toISOString(),
        },
    });
};

/**
 * Queue leave status notification
 */
export const queueLeaveStatusEmail = async (
    to: string,
    name: string,
    status: 'approved' | 'rejected',
    leaveDetails: any
): Promise<void> => {
    const template = status === 'approved' ? 'leave-approved' : 'leave-rejected';

    await queueEmail({
        to,
        subject: `Leave Request ${status === 'approved' ? 'Approved' : 'Rejected'}`,
        template: template as any,
        data: {
            name,
            ...leaveDetails,
        },
    }, 5); // Medium priority
};

/**
 * Queue attendance reminder
 */
export const queueAttendanceReminder = async (
    to: string,
    name: string
): Promise<void> => {
    await queueEmail({
        to,
        subject: 'Attendance Reminder',
        template: 'attendance-reminder' as any,
        data: {
            name,
            date: new Date().toLocaleDateString(),
        },
    });
};

/**
 * Queue email verification
 */
export const queueVerificationEmail = async (
    to: string,
    name: string,
    verificationToken: string
): Promise<void> => {
    const verificationUrl = `${config.frontend.url}/verify-email?token=${verificationToken}`;

    await queueEmail({
        to,
        subject: 'Verify Your Email Address',
        template: 'email-verification' as any,
        data: {
            name,
            verificationUrl,
        },
    }, 10); // High priority
};

/**
 * Get notification queue stats
 */
export const getNotificationQueueStats = async () => {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
        emailQueue.getWaitingCount(),
        emailQueue.getActiveCount(),
        emailQueue.getCompletedCount(),
        emailQueue.getFailedCount(),
        emailQueue.getDelayedCount(),
    ]);

    return {
        name: QUEUE_NAMES.EMAIL_NOTIFICATIONS,
        waiting,
        active,
        completed,
        failed,
        delayed,
    };
};


