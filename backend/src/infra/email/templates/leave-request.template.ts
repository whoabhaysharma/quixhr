import { emailLayout } from './email.layout';

export const leaveRequestTemplate = (data: {
    recipientName: string;
    employeeName: string;
    employeeCode?: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    daysTaken: number;
    reason?: string;
    organizationName: string;
}) => {
    const content = `
        <h1 style="margin: 0 0 16px 0; padding: 0; color: #000000; font-size: 28px; font-weight: 600; text-align: center; line-height: 1.3; font-family: 'Lexend', Arial, sans-serif;">New Leave Request</h1>
        
        <div style="height: 1px; background: linear-gradient(to right, transparent, #e5e5e5 20%, #e5e5e5 80%, transparent); margin: 32px 0;"></div>
        
        <p style="margin: 0 0 16px 0; color: #404040; font-size: 15px; line-height: 1.6; font-family: 'Lexend', Arial, sans-serif;">Hello <strong style="color: #000000; font-weight: 600;">${data.recipientName}</strong>,</p>
        <p style="margin: 0 0 24px 0; color: #404040; font-size: 15px; line-height: 1.6; font-family: 'Lexend', Arial, sans-serif;">An employee has submitted a new leave request that requires your review.</p>
        
        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%); border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #000000;">
            <p style="margin: 0 0 8px 0; color: #737373; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; font-family: 'Lexend', Arial, sans-serif;">Employee</p>
            <p style="margin: 0 0 16px 0; color: #000000; font-size: 18px; font-weight: 600; font-family: 'Lexend', Arial, sans-serif;">${data.employeeName}${data.employeeCode ? ` (${data.employeeCode})` : ''}</p>
            
            <p style="margin: 0 0 8px 0; color: #737373; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; font-family: 'Lexend', Arial, sans-serif;">Leave Type</p>
            <p style="margin: 0; color: #000000; font-size: 16px; font-weight: 600; font-family: 'Lexend', Arial, sans-serif;">${data.leaveType}</p>
        </div>
        
        <h2 style="margin: 24px 0 12px 0; color: #000000; font-size: 20px; font-weight: 600; font-family: 'Lexend', Arial, sans-serif;">Request Details</h2>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #f0f0f0;">
                <td style="padding: 12px 0; color: #737373; font-size: 15px; font-weight: 500; width: 40%; font-family: 'Lexend', Arial, sans-serif;">Start Date</td>
                <td style="padding: 12px 0; color: #000000; font-size: 15px; font-weight: 600; text-align: right; font-family: 'Lexend', Arial, sans-serif;">${data.startDate}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f0f0f0;">
                <td style="padding: 12px 0; color: #737373; font-size: 15px; font-weight: 500; font-family: 'Lexend', Arial, sans-serif;">End Date</td>
                <td style="padding: 12px 0; color: #000000; font-size: 15px; font-weight: 600; text-align: right; font-family: 'Lexend', Arial, sans-serif;">${data.endDate}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f0f0f0;">
                <td style="padding: 12px 0; color: #737373; font-size: 15px; font-weight: 500; font-family: 'Lexend', Arial, sans-serif;">Total Days</td>
                <td style="padding: 12px 0; color: #000000; font-size: 15px; font-weight: 600; text-align: right; font-family: 'Lexend', Arial, sans-serif;">${data.daysTaken} day(s)</td>
            </tr>
            ${data.reason ? `
            <tr>
                <td colspan="2" style="padding: 12px 0;">
                    <p style="margin: 8px 0 4px 0; color: #737373; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; font-family: 'Lexend', Arial, sans-serif;">Reason</p>
                    <p style="margin: 0; color: #404040; font-size: 15px; line-height: 1.6; font-family: 'Lexend', Arial, sans-serif;">${data.reason}</p>
                </td>
            </tr>
            ` : ''}
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0;">
            <tr>
                <td align="center">
                    <div style="display: inline-block; padding: 16px 32px; border-radius: 8px; background-color: #000000; text-decoration: none; transition: all 0.2s ease;">
                        <span style="color: #ffffff; font-size: 15px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; font-family: 'Lexend', Arial, sans-serif;">Review Request</span>
                    </div>
                </td>
            </tr>
        </table>
        
        <div style="height: 1px; background: linear-gradient(to right, transparent, #e5e5e5 20%, #e5e5e5 80%, transparent); margin: 32px 0;"></div>
        
        <p style="margin: 0 0 8px 0; color: #737373; font-size: 13px; text-align: center; font-family: 'Lexend', Arial, sans-serif;">This is an approval request for <strong style="color: #000000;">${data.organizationName}</strong>.</p>
        <p style="margin: 0; color: #737373; font-size: 13px; text-align: center; font-family: 'Lexend', Arial, sans-serif;">Please log in to your dashboard to approve or reject this request.</p>
    `;

    return emailLayout({
        title: 'New Leave Request - Action Required',
        content,
    });
};
