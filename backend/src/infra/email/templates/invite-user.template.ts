import { emailLayout } from './email.layout';

export const inviteUserTemplate = (data: { inviteLink: string; organizationName: string; role: string }) => {
    const content = `
        <h1 style="margin: 0 0 16px 0; padding: 0; color: #000000; font-size: 28px; font-weight: 600; text-align: center; line-height: 1.3; font-family: 'Lexend', Arial, sans-serif;">You're Invited to Join<br/>${data.organizationName}</h1>
        
        <div style="height: 1px; background: linear-gradient(to right, transparent, #e5e5e5 20%, #e5e5e5 80%, transparent); margin: 32px 0;"></div>
        
        <p style="margin: 0 0 16px 0; color: #404040; font-size: 15px; line-height: 1.6; text-align: center; font-family: 'Lexend', Arial, sans-serif;">You have been invited to join <strong style="color: #000000; font-weight: 600;">${data.organizationName}</strong> on QuixHR. We're excited to have you as part of the team.</p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
            <tr>
                <td align="center" style="background-color: #000000; border-radius: 8px; padding: 24px;">
                    <p style="margin: 0 0 8px 0; color: #a3a3a3; font-size: 13px; font-family: 'Lexend', Arial, sans-serif;">Your Assigned Role</p>
                    <p style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 600; font-family: 'Lexend', Arial, sans-serif;">${data.role}</p>
                </td>
            </tr>
        </table>

        <p style="margin: 0 0 16px 0; color: #404040; font-size: 15px; line-height: 1.6; text-align: center; font-family: 'Lexend', Arial, sans-serif;">Click the button below to accept your invitation and set up your account.</p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
            <tr>
                <td align="center">
                    <a href="${data.inviteLink}" style="display: inline-block; background-color: #000000; color: #ffffff; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: 'Lexend', Arial, sans-serif; border: 2px solid #000000;">Accept Invitation</a>
                </td>
            </tr>
        </table>
        
        <div style="height: 1px; background: linear-gradient(to right, transparent, #e5e5e5 20%, #e5e5e5 80%, transparent); margin: 32px 0;"></div>
        
        <p style="margin: 0 0 8px 0; color: #737373; font-size: 13px; text-align: center; font-family: 'Lexend', Arial, sans-serif;">This invitation link will expire in <strong style="color: #000000;">7 days</strong>.</p>
        <p style="margin: 0; color: #737373; font-size: 13px; text-align: center; font-family: 'Lexend', Arial, sans-serif;">If you weren't expecting this invitation, you can safely ignore this email.</p>
    `;

    return emailLayout({
        title: `Invitation to join ${data.organizationName}`,
        content,
    });
};
