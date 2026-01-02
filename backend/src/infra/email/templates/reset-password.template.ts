export const resetPasswordTemplate = (data: { name: string; resetLink: string; expiresIn: string }) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reset Password</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2c3e50;">Password Reset Request</h1>
    </div>
    
    <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
        <p>Hello ${data.name || 'User'},</p>
        
        <p>We received a request to reset your password for your QuixHR account.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${data.resetLink}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        
        <p>This link will expire in <strong>${data.expiresIn}</strong>.</p>
        
        <p style="font-size: 14px; color: #666;">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
    </div>
    
    <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #999;">
        <p>&copy; ${new Date().getFullYear()} QuixHR. All rights reserved.</p>
    </div>
</body>
</html>
`;
