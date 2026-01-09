import { SendEmailCommand } from '@aws-sdk/client-ses';
import { sesClient } from './ses.client';
import { config } from '../../config';
import { Logger } from '../../utils/logger';

interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data?: Record<string, any>;
}

import { verifyEmailTemplate } from './templates/verify-email.template';
import { resetPasswordTemplate } from './templates/reset-password.template';
import { inviteUserTemplate } from './templates/invite-user.template';
import { leaveStatusTemplate } from './templates/leave-status.template';
import { leaveRequestTemplate } from './templates/leave-request.template';
import { loginAlertTemplate } from './templates/login-alert.template';

const getHtmlContent = (template: string, data: any): string => {
  switch (template) {
    case 'verify-email':
      return verifyEmailTemplate(data);
    case 'reset-password':
      return resetPasswordTemplate(data);
    case 'login-alert':
      return loginAlertTemplate(data);
    case 'invite-user':
      return inviteUserTemplate(data);
    case 'leave-status':
      return leaveStatusTemplate(data);
    case 'leave-request':
      return leaveRequestTemplate(data);
    default:
      return `<p>${JSON.stringify(data)}</p>`;
  }
};

// Helper to strip HTML for plain text version (Crucial for spam scores)
const stripHtml = (html: string): string => {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove style tags
    .replace(/<br\s*\/?>/gi, '\n') // Replace breaks with newlines
    .replace(/<\/p>/gi, '\n\n') // Paragraphs to double newlines
    .replace(/<\/tr>/gi, '\n') // Table rows to newlines
    .replace(/<\/td>/gi, ' ') // Table cells to space
    .replace(/<[^>]+>/g, '') // Remove remaining tags
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ') // Collapse whitespace
    .trim();
};

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  if (!config.aws.accessKeyId || !config.aws.secretAccessKey) {
    Logger.warn('⚠️ AWS credentials not found. Emails will behave as mock.');
    Logger.info(`[MOCK EMAIL] To: ${options.to} | Subject: ${options.subject}`);
    return;
  }

  try {
    const htmlContent = getHtmlContent(options.template, options.data);
    const textContent = stripHtml(htmlContent);

    const command = new SendEmailCommand({
      Source: config.email.from, // Must be a verified email in SES
      Destination: {
        ToAddresses: [options.to],
      },
      Message: {
        Subject: {
          Data: options.subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: htmlContent,
            Charset: 'UTF-8',
          },
          // Include Plain Text version for better deliverability and spam score
          Text: {
            Data: textContent,
            Charset: 'UTF-8',
          }
        },
      },
      // ReplyToAddresses: ['support@quixhr.com'], // Good practice to have
    });

    const response = await sesClient.send(command);
    Logger.info('Message sent: %s', { messageId: response.MessageId });
  } catch (error: any) {
    Logger.error('Error sending email via SES:', { error: error.message });
    // Rethrow to allow worker to handle retries (or decide not to)
    throw error;
  }
};
