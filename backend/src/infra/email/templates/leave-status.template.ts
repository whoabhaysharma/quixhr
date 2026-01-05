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
    const statusColor = isApproved ? '#22c55e' : '#ef4444'; // Green-500 : Red-500

    const content = `
        <div class="text-center">
            <h1>Leave Request Update</h1>
            <p>Hello <strong>${data.employeeName}</strong>,</p>
            <p>Your leave request for <strong>${data.leaveType}</strong> has been processed.</p>
            
            <div style="background-color: ${isApproved ? '#dcfce7' : '#fee2e2'}; border-radius: 8px; padding: 16px; margin: 24px 0; text-align: center;">
                 <span style="color: ${isApproved ? '#166534' : '#991b1b'}; font-weight: 700; font-size: 18px; text-transform: uppercase; letter-spacing: 0.05em;">${data.status}</span>
            </div>
            
            <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: left;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Duration</td>
                        <td style="padding: 8px 0; font-weight: 600; color: #1e293b; text-align: right;">${data.startDate} - ${data.endDate}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Total Days</td>
                        <td style="padding: 8px 0; font-weight: 600; color: #1e293b; text-align: right;">${data.daysTaken} day(s)</td>
                    </tr>
                    ${data.reason ? `
                    <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; margin-top: 8px; padding-top: 12px;">Reason</td>
                        <td style="padding: 8px 0; color: #1e293b; text-align: right; border-top: 1px solid #e2e8f0; margin-top: 8px; padding-top: 12px;">${data.reason}</td>
                    </tr>
                    ` : ''}
                </table>
            </div>

            <p class="text-sm text-muted">This update is for your record at <strong>${data.organizationName}</strong>.</p>
            <p class="text-sm text-muted">If you have questions, please contact your manager or HR department.</p>
        </div>
    `;

    return emailLayout({
        title: `Leave Request ${data.status}`,
        content,
    });
};
