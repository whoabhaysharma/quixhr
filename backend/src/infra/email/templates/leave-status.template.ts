
export const leaveStatusTemplate = (data: {
    status: string;
    employeeName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    daysTaken: number;
    organizationName: string;
    reason?: string;
}) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Leave Request ${data.status}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: ${data.status === 'APPROVED' ? '#28a745' : '#dc3545'}; text-transform: uppercase;">Leave Request ${data.status}</h1>
    </div>
    
    <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px; border-left: 5px solid ${data.status === 'APPROVED' ? '#28a745' : '#dc3545'};">
        <p>Hello <strong>${data.employeeName}</strong>,</p>
        
        <p>Your leave request for <strong>${data.leaveType}</strong> has been <strong>${data.status.toLowerCase()}</strong>.</p>
        
        <div style="margin: 20px 0; padding: 15px; background-color: #fff; border-radius: 4px;">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 5px 0; color: #666;">Duration:</td>
                    <td style="padding: 5px 0; font-weight: bold;">${data.startDate} to ${data.endDate}</td>
                </tr>
                <tr>
                    <td style="padding: 5px 0; color: #666;">Total Days:</td>
                    <td style="padding: 5px 0; font-weight: bold;">${data.daysTaken} day(s)</td>
                </tr>
                ${data.reason ? `
                <tr>
                    <td style="padding: 5px 0; color: #666;">Reason:</td>
                    <td style="padding: 5px 0;">${data.reason}</td>
                </tr>
                ` : ''}
            </table>
        </div>
        
        <p>This update is for your record at <strong>${data.organizationName}</strong>.</p>
        
        <p style="font-size: 14px; color: #666;">If you have any questions, please contact your manager or HR department.</p>
    </div>
    
    <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #999;">
        <p>&copy; ${new Date().getFullYear()} QuixHR. All rights reserved.</p>
    </div>
</body>
</html>
`;
