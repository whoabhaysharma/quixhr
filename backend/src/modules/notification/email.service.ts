import { SendEmailCommand } from '@aws-sdk/client-ses';
import Handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import { sesClient } from '../../infra/email/ses.client';
import { EmailPayload, EmailTemplate } from './notification.types';
import { config } from '../../config';

const FROM_EMAIL = config.email.from;
const templateCache = new Map<string, HandlebarsTemplateDelegate>();

/**
 * Render email template with data
 */
const renderTemplate = async (
    template: EmailTemplate | string,
    data: Record<string, any>
): Promise<string> => {
    // Check cache
    let compiledTemplate = templateCache.get(template);

    if (!compiledTemplate) {
        // Load and compile template
        const templatePath = path.join(
            __dirname,
            'templates',
            `${template}.html`
        );
        const templateContent = await fs.readFile(templatePath, 'utf-8');
        compiledTemplate = Handlebars.compile(templateContent);

        // Cache it
        templateCache.set(template, compiledTemplate);
    }

    return compiledTemplate(data);
};

/**
 * Send email using Amazon SES
 */
export const sendEmail = async (payload: EmailPayload): Promise<void> => {
    try {
        // Compile template
        const html = await renderTemplate(payload.template, payload.data);

        // Send email via SES
        const command = new SendEmailCommand({
            Source: FROM_EMAIL,
            Destination: {
                ToAddresses: [payload.to],
            },
            Message: {
                Subject: {
                    Data: payload.subject,
                    Charset: 'UTF-8',
                },
                Body: {
                    Html: {
                        Data: html,
                        Charset: 'UTF-8',
                    },
                },
            },
        });

        const response = await sesClient.send(command);
        console.log(`✅ Email sent to ${payload.to}:`, response.MessageId);
    } catch (error) {
        console.error('❌ Failed to send email:', error);
        throw error;
    }
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (
    to: string,
    resetToken: string
): Promise<void> => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await sendEmail({
        to,
        subject: 'Reset Your Password',
        template: EmailTemplate.RESET_PASSWORD,
        data: {
            resetUrl,
            expiresIn: '1 hour',
        },
    });
};

/**
 * Send welcome email
 */
export const sendWelcomeEmail = async (
    to: string,
    name: string
): Promise<void> => {
    await sendEmail({
        to,
        subject: 'Welcome to QuixHR',
        template: EmailTemplate.WELCOME,
        data: {
            name,
            loginUrl: `${process.env.FRONTEND_URL}/login`,
        },
    });
};

/**
 * Send login alert
 */
export const sendLoginAlert = async (
    to: string,
    name: string,
    ipAddress: string
): Promise<void> => {
    await sendEmail({
        to,
        subject: 'New Login Detected',
        template: EmailTemplate.LOGIN_ALERT,
        data: {
            name,
            ipAddress,
            timestamp: new Date().toISOString(),
        },
    });
};

/**
 * Send leave status notification
 */
export const sendLeaveStatusEmail = async (
    to: string,
    name: string,
    status: 'approved' | 'rejected',
    leaveDetails: any
): Promise<void> => {
    const template = status === 'approved'
        ? EmailTemplate.LEAVE_APPROVED
        : EmailTemplate.LEAVE_REJECTED;

    await sendEmail({
        to,
        subject: `Leave Request ${status === 'approved' ? 'Approved' : 'Rejected'}`,
        template,
        data: {
            name,
            ...leaveDetails,
        },
    });
};

/**
 * Send attendance reminder
 */
export const sendAttendanceReminder = async (
    to: string,
    name: string
): Promise<void> => {
    await sendEmail({
        to,
        subject: 'Attendance Reminder',
        template: EmailTemplate.ATTENDANCE_REMINDER,
        data: {
            name,
            date: new Date().toLocaleDateString(),
        },
    });
};
