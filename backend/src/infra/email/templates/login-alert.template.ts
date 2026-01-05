import { emailLayout } from './email.layout';

export const loginAlertTemplate = (data: { name: string; device: string; time: string }) => {
    const content = `
        <div class="text-center">
            <h1>New Login Detected</h1>
            
            <div style="background-color: #fff7ed; border-left: 4px solid #f97316; padding: 20px; border-radius: 8px; text-align: left; margin-bottom: 24px;">
                <p style="margin-top: 0; font-weight: 600; color: #9a3412;">Security Alert</p>
                <p style="margin-bottom: 0;">We noticed a new login to your QuixHR account assigned to <strong>${data.name}</strong>.</p>
            </div>
            
            <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: left;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Time</td>
                        <td style="padding: 8px 0; font-weight: 600; color: #1e293b; text-align: right;">${data.time}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Device</td>
                        <td style="padding: 8px 0; font-weight: 600; color: #1e293b; text-align: right;">${data.device}</td>
                    </tr>
                </table>
            </div>

            <p style="text-align: left;">If this was you, you can simply ignore this email.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: left;">
                <p style="font-weight: 600; margin-bottom: 8px; color: #ef4444;">Not you?</p>
                <p class="text-sm text-muted">Please <a href="${process.env.FRONTEND_URL}/reset-password" style="color: #4f46e5; text-decoration: underline;">reset your password</a> immediately to secure your account.</p>
            </div>
        </div>
    `;

    return emailLayout({
        title: 'New Login Detected',
        content,
    });
};
