
export const inviteUserTemplate = (data: { inviteLink: string; organizationName: string; role: string }) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invitation to join ${data.organizationName}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2c3e50;">Join ${data.organizationName} on QuixHR</h1>
    </div>
    
    <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
        <p>Hello,</p>
        
        <p>You have been invited to join <strong>${data.organizationName}</strong> as a <strong>${data.role}</strong>.</p>
        
        <p>Click the button below to accept the invitation and set up your account:</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${data.inviteLink}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Accept Invitation</a>
        </div>
        
        <p style="font-size: 14px; color: #666;">This invitation will expire in 7 days.</p>
        <p style="font-size: 14px; color: #666;">If you were not expecting this invitation, you can safely ignore this email.</p>
    </div>
    
    <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #999;">
        <p>&copy; ${new Date().getFullYear()} QuixHR. All rights reserved.</p>
    </div>
</body>
</html>
`;
