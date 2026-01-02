import { SendEmailCommand } from '@aws-sdk/client-ses';
import { sesClient } from './ses.client';
import { config } from '../../config';

interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data?: Record<string, any>;
}

import { verifyEmailTemplate } from './templates/verify-email.template';
import { resetPasswordTemplate } from './templates/reset-password.template';
import { loginAlertTemplate } from './templates/login-alert.template';

const getHtmlContent = (template: string, data: any): string => {
  switch (template) {
    case 'verify-email':
      return verifyEmailTemplate(data);
    case 'reset-password':
      return resetPasswordTemplate(data);
    case 'login-alert':
      return loginAlertTemplate(data);
    default:
      return `<p>${JSON.stringify(data)}</p>`;
  }
};

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  if (!config.aws.accessKeyId || !config.aws.secretAccessKey) {
    console.warn('⚠️ AWS credentials not found. Emails will behave as mock.');
    console.log(`[MOCK EMAIL] To: ${options.to} | Subject: ${options.subject}`);
    return;
  }

  try {
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
            Data: getHtmlContent(options.template, options.data),
            Charset: 'UTF-8',
          },
        },
      },
    });

    const response = await sesClient.send(command);
    console.log('Message sent: %s', response.MessageId);
  } catch (error) {
    console.error('Error sending email via SES:', error);
  }
};
