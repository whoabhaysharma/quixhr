export const verifyEmailTemplate = (data: { name: string; verificationLink: string }) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Verify Email</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2c3e50;">Welcome to QuixHR!</h1>
    </div>
    
    <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
        <p>Hello ${data.name},</p>
        
        <p>Thanks for getting started with QuixHR! We're excited to have you on board.</p>
        
        <p>Please verify your email address to activate your account and access all features.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${data.verificationLink}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Verify Email Address</a>
        </div>
        
        <p style="font-size: 14px; color: #666;">If you didn't create an account with QuixHR, please ignore this email.</p>
    </div>
    
    <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #999;">
        <p>&copy; ${new Date().getFullYear()} QuixHR. All rights reserved.</p>
    </div>
</body>
</html>
`;
