import { emailLayout } from './email.layout';

export const verifyEmailTemplate = (data: { name: string; verificationLink: string }) => {
    const content = `
        <h1 style="margin: 0 0 16px 0; padding: 0; color: #000000; font-size: 28px; font-weight: 600; text-align: center; line-height: 1.3; font-family: 'Lexend', Arial, sans-serif;">Welcome to QuixHR!</h1>
        
        <div style="height: 1px; background: linear-gradient(to right, transparent, #e5e5e5 20%, #e5e5e5 80%, transparent); margin: 32px 0;"></div>
        
        <p style="margin: 0 0 16px 0; color: #404040; font-size: 15px; line-height: 1.6; font-family: 'Lexend', Arial, sans-serif;">Hello <strong style="color: #000000; font-weight: 600;">${data.name}</strong>,</p>
        <p style="margin: 0 0 16px 0; color: #404040; font-size: 15px; line-height: 1.6; font-family: 'Lexend', Arial, sans-serif;">Thank you for signing up with QuixHR. We're excited to have you on board and help streamline your HR operations.</p>
        <p style="margin: 0 0 16px 0; color: #404040; font-size: 15px; line-height: 1.6; font-family: 'Lexend', Arial, sans-serif;">To get started, please verify your email address by clicking the button below.</p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
            <tr>
                <td align="center">
                    <a href="${data.verificationLink}" style="display: inline-block; background-color: #000000; color: #ffffff; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: 'Lexend', Arial, sans-serif; border: 2px solid #000000;">Verify Email Address</a>
                </td>
            </tr>
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
            <tr>
                <td style="background-color: #f9f9f9; border: 1px solid #e5e5e5; border-radius: 8px; padding: 20px;">
                    <p style="margin: 0; font-size: 14px; color: #404040; font-family: 'Lexend', Arial, sans-serif;"><strong style="color: #000000; font-weight: 600;">Why verify?</strong> Email verification helps us ensure the security of your account and enables important notifications.</p>
                </td>
            </tr>
        </table>
        
        <div style="height: 1px; background: linear-gradient(to right, transparent, #e5e5e5 20%, #e5e5e5 80%, transparent); margin: 32px 0;"></div>
        
        <p style="margin: 0 0 8px 0; color: #737373; font-size: 13px; font-family: 'Lexend', Arial, sans-serif;">If the button doesn't work, copy and paste this URL into your browser:</p>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 24px 0;">
            <tr>
                <td style="background-color: #fafafa; border-radius: 8px; padding: 16px;">
                    <p style="margin: 0; word-break: break-all; color: #000000; font-size: 12px; font-family: monospace, 'Courier New', Courier;">${data.verificationLink}</p>
                </td>
            </tr>
        </table>
        
        <p style="margin: 24px 0 0 0; color: #737373; font-size: 13px; text-align: center; font-family: 'Lexend', Arial, sans-serif;">If you didn't create an account with QuixHR, you can safely ignore this email.</p>
    `;

    return emailLayout({
        title: 'Verify Email',
        content,
    });
};
