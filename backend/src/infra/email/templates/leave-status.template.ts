import { emailLayout } from './email.layout';

export const leaveStatusTemplate = (data: {
    status: string;
    employeeName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    daysTaken: number;
    organizationName: string;
    reason?: string;
}) => {
    const isApproved = data.status === 'APPROVED';
    const statusBgColor = isApproved ? '#000000' : '#ffffff';
    const statusTextColor = isApproved ? '#ffffff' : '#000000';
    const statusBorder = isApproved ? 'none' : '2px solid #000000';

    const content = `
        <h1 style="margin: 0 0 16px 0; padding: 0; color: #000000; font-size: 28px; font-weight: 600; text-align: center; line-height: 1.3; font-family: 'Lexend', Arial, sans-serif;">Leave Request Update</h1>
        
        <div style="height: 1px; background: linear-gradient(to right, transparent, #e5e5e5 20%, #e5e5e5 80%, transparent); margin: 32px 0;"></div>
        
        <p style="margin: 0 0 16px 0; color: #404040; font-size: 15px; line-height: 1.6; font-family: 'Lexend', Arial, sans-serif;">Hello <strong style="color: #000000; font-weight: 600;">${data.employeeName}</strong>,</p>
        <p style="margin: 0 0 16px 0; color: #404040; font-size: 15px; line-height: 1.6; font-family: 'Lexend', Arial, sans-serif;">Your leave request for <strong style="color: #000000; font-weight: 600;">${data.leaveType}</strong> has been processed and the status has been updated.</p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0;">
            <tr>
                <td align="center">
                    <span style="display: inline-block; padding: 8px 16px; border-radius: 6px; background-color: ${statusBgColor}; color: ${statusTextColor}; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; font-family: 'Lexend', Arial, sans-serif; border: ${statusBorder};">${data.status}</span>
                </td>
            </tr>
        </table>
        
        <h2 style="margin: 24px 0 12px 0; color: #000000; font-size: 20px; font-weight: 600; font-family: 'Lexend', Arial, sans-serif;">Request Details</h2>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #f0f0f0;">
                <td style="padding: 12px 0; color: #737373; font-size: 15px; font-weight: 500; width: 40%; font-family: 'Lexend', Arial, sans-serif;">Leave Type</td>
                <td style="padding: 12px 0; color: #000000; font-size: 15px; font-weight: 600; text-align: right; font-family: 'Lexend', Arial, sans-serif;">${data.leaveType}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f0f0f0;">
                <td style="padding: 12px 0; color: #737373; font-size: 15px; font-weight: 500; font-family: 'Lexend', Arial, sans-serif;">Duration</td>
                <td style="padding: 12px 0; color: #000000; font-size: 15px; font-weight: 600; text-align: right; font-family: 'Lexend', Arial, sans-serif;">${data.startDate} - ${data.endDate}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f0f0f0;">
                <td style="padding: 12px 0; color: #737373; font-size: 15px; font-weight: 500; font-family: 'Lexend', Arial, sans-serif;">Total Days</td>
                <td style="padding: 12px 0; color: #000000; font-size: 15px; font-weight: 600; text-align: right; font-family: 'Lexend', Arial, sans-serif;">${data.daysTaken} day(s)</td>
            </tr>
            ${data.reason ? `
            <tr>
                <td style="padding: 12px 0; color: #737373; font-size: 15px; font-weight: 500; font-family: 'Lexend', Arial, sans-serif;">Reason</td>
                <td style="padding: 12px 0; color: #000000; font-size: 15px; font-weight: 600; text-align: right; font-family: 'Lexend', Arial, sans-serif;">${data.reason}</td>
            </tr>
            ` : ''}
        </table>
        
        <div style="height: 1px; background: linear-gradient(to right, transparent, #e5e5e5 20%, #e5e5e5 80%, transparent); margin: 32px 0;"></div>
        
        <p style="margin: 0 0 8px 0; color: #737373; font-size: 13px; text-align: center; font-family: 'Lexend', Arial, sans-serif;">This notification is for your records at <strong style="color: #000000;">${data.organizationName}</strong>.</p>
        <p style="margin: 0; color: #737373; font-size: 13px; text-align: center; font-family: 'Lexend', Arial, sans-serif;">If you have any questions, please contact your manager or HR department.</p>
    `;

    return emailLayout({
        title: `Leave Request ${data.status}`,
        content,
    });
};
