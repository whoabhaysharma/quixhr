import { emailLayout } from './email.layout';

export const loginAlertTemplate = (data: { name: string; device: string; time: string }) => {
    const content = `
        <h1 style="margin: 0 0 16px 0; padding: 0; color: #000000; font-size: 28px; font-weight: 600; text-align: center; line-height: 1.3; font-family: 'Lexend', Arial, sans-serif;">New Login Detected</h1>
        
        <div style="height: 1px; background: linear-gradient(to right, transparent, #e5e5e5 20%, #e5e5e5 80%, transparent); margin: 32px 0;"></div>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
            <tr>
                <td style="background-color: #f9f9f9; border-left: 4px solid #000000; padding: 20px; border-radius: 0 8px 8px 0;">
                    <p style="margin: 0 0 8px 0; font-weight: 600; color: #000000; font-size: 15px; font-family: 'Lexend', Arial, sans-serif;">🔒 Security Alert</p>
                    <p style="margin: 0; color: #404040; font-size: 15px; line-height: 1.6; font-family: 'Lexend', Arial, sans-serif;">We detected a new login to your QuixHR account for <strong style="color: #000000; font-weight: 600;">${data.name}</strong>. If this was you, no action is needed.</p>
                </td>
            </tr>
        </table>
        
        <h2 style="margin: 24px 0 12px 0; color: #000000; font-size: 20px; font-weight: 600; font-family: 'Lexend', Arial, sans-serif;">Login Details</h2>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #f0f0f0;">
                <td style="padding: 12px 0; color: #737373; font-size: 15px; font-weight: 500; width: 40%; font-family: 'Lexend', Arial, sans-serif;">Date & Time</td>
                <td style="padding: 12px 0; color: #000000; font-size: 15px; font-weight: 600; text-align: right; font-family: 'Lexend', Arial, sans-serif;">${data.time}</td>
            </tr>
            <tr>
                <td style="padding: 12px 0; color: #737373; font-size: 15px; font-weight: 500; font-family: 'Lexend', Arial, sans-serif;">Device</td>
                <td style="padding: 12px 0; color: #000000; font-size: 15px; font-weight: 600; text-align: right; font-family: 'Lexend', Arial, sans-serif;">${data.device}</td>
            </tr>
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0 24px 0;">
            <tr>
                <td style="background-color: #f9f9f9; border: 1px solid #e5e5e5; border-radius: 8px; padding: 20px;">
                    <p style="margin: 0 0 8px 0; font-weight: 600; color: #000000; font-size: 15px; font-family: 'Lexend', Arial, sans-serif;">Was this you?</p>
                    <p style="margin: 0; color: #404040; font-size: 15px; line-height: 1.6; font-family: 'Lexend', Arial, sans-serif;">If you recognize this activity, you can safely ignore this email. Your account remains secure.</p>
                </td>
            </tr>
        </table>
        
        <div style="height: 1px; background: linear-gradient(to right, transparent, #e5e5e5 20%, #e5e5e5 80%, transparent); margin: 32px 0;"></div>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
            <tr>
                <td style="background-color: #000000; border-radius: 8px; padding: 24px;">
                    <p style="margin: 0 0 8px 0; font-weight: 600; color: #ffffff; font-size: 15px; font-family: 'Lexend', Arial, sans-serif;">⚠️ Don't recognize this login?</p>
                    <p style="margin: 0 0 16px 0; color: #e5e5e5; font-size: 15px; line-height: 1.6; font-family: 'Lexend', Arial, sans-serif;">If you didn't authorize this login, your account may be compromised. Take action immediately to secure your account.</p>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                            <td align="center">
                                <a href="${process.env.FRONTEND_URL}/reset-password" style="display: inline-block; background-color: #ffffff; color: #000000; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: 'Lexend', Arial, sans-serif; border: 2px solid #ffffff;">Reset Password Now</a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
        
        <p style="margin: 24px 0 0 0; color: #737373; font-size: 13px; text-align: center; font-family: 'Lexend', Arial, sans-serif;">For additional security concerns, please contact your system administrator.</p>
    `;

    return emailLayout({
        title: 'New Login Detected',
        content,
    });
};
