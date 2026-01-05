import { emailLayout } from './email.layout';

export const resetPasswordTemplate = (data: { name: string; resetLink: string; expiresIn: string }) => {
    const content = `
        <h1 style="margin: 0 0 16px 0; padding: 0; color: #000000; font-size: 28px; font-weight: 600; text-align: center; line-height: 1.3; font-family: 'Lexend', Arial, sans-serif;">Reset Your Password</h1>
        
        <div style="height: 1px; background: linear-gradient(to right, transparent, #e5e5e5 20%, #e5e5e5 80%, transparent); margin: 32px 0;"></div>
        
        <p style="margin: 0 0 16px 0; color: #404040; font-size: 15px; line-height: 1.6; font-family: 'Lexend', Arial, sans-serif;">Hello <strong style="color: #000000; font-weight: 600;">${data.name || 'User'}</strong>,</p>
        <p style="margin: 0 0 16px 0; color: #404040; font-size: 15px; line-height: 1.6; font-family: 'Lexend', Arial, sans-serif;">We received a request to reset the password for your QuixHR account. Click the button below to create a new password.</p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
            <tr>
                <td align="center">
                    <a href="${data.resetLink}" style="display: inline-block; background-color: #000000; color: #ffffff; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: 'Lexend', Arial, sans-serif; border: 2px solid #000000;">Reset Password</a>
                </td>
            </tr>
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
            <tr>
                <td style="background-color: #f9f9f9; border: 1px solid #e5e5e5; border-radius: 8px; padding: 20px;">
                    <p style="margin: 0; font-size: 14px; color: #404040; font-family: 'Lexend', Arial, sans-serif;"><strong style="color: #000000; font-weight: 600;">⏱️ Link Expiration:</strong> This password reset link will expire in <strong style="color: #000000; font-weight: 600;">${data.expiresIn}</strong>.</p>
                </td>
            </tr>
        </table>
        
        <div style="height: 1px; background: linear-gradient(to right, transparent, #e5e5e5 20%, #e5e5e5 80%, transparent); margin: 32px 0;"></div>
        
        <p style="margin: 0 0 8px 0; color: #737373; font-size: 13px; font-family: 'Lexend', Arial, sans-serif;">If the button doesn't work, copy and paste this URL into your browser:</p>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 24px 0;">
            <tr>
                <td style="background-color: #fafafa; border-radius: 8px; padding: 16px;">
                    <p style="margin: 0; word-break: break-all; color: #000000; font-size: 12px; font-family: monospace, 'Courier New', Courier;">${data.resetLink}</p>
                </td>
            </tr>
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0 0 0;">
            <tr>
                <td style="background-color: #f9f9f9; border-left: 4px solid #000000; padding: 20px; border-radius: 0 8px 8px 0;">
                    <p style="margin: 0 0 8px 0; font-weight: 600; color: #000000; font-size: 15px; font-family: 'Lexend', Arial, sans-serif;">Didn't request this?</p>
                    <p style="margin: 0; color: #404040; font-size: 15px; line-height: 1.6; font-family: 'Lexend', Arial, sans-serif;">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
                </td>
            </tr>
        </table>
    `;

    return emailLayout({
        title: 'Reset Password',
        content,
    });
};
