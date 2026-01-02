export const loginAlertTemplate = (data: { name: string; device: string; time: string }) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>New Login Detected</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2c3e50; border-bottom: 2px solid #e74c3c; padding-bottom: 10px; display: inline-block;">Security Alert</h1>
    </div>
    
    <div style="background-color: #fff3cd; border: 1px solid #ffeeba; padding: 30px; border-radius: 8px; color: #856404;">
        <p style="font-weight: bold; font-size: 18px;">New Login Detected</p>
        
        <p>Hello ${data.name},</p>
        
        <p>We noticed a new login to your QuixHR account.</p>
        
        <ul style="list-style: none; padding: 0; margin: 20px 0;">
            <li style="margin-bottom: 10px;"><strong>🕒 Time:</strong> ${data.time}</li>
            <li style="margin-bottom: 10px;"><strong>💻 Device/Browser:</strong> ${data.device}</li>
        </ul>
        
        <p>If this was you, you can simply ignore this email.</p>
    </div>
    
    <div style="margin-top: 20px; padding: 20px; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; color: #721c24;">
        <p style="margin: 0; font-weight: bold;">Not you?</p>
        <p style="margin: 10px 0 0 0;">Please <a href="${process.env.FRONTEND_URL}/reset-password" style="color: #721c24; text-decoration: underline;">reset your password</a> immediately to secure your account.</p>
    </div>
    
    <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #999;">
        <p>&copy; ${new Date().getFullYear()} QuixHR. All rights reserved.</p>
    </div>
</body>
</html>
`;
