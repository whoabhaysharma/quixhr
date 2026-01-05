import { emailLayout } from './email.layout';

export const verifyEmailTemplate = (data: { name: string; verificationLink: string }) => {
    const content = `
        <div class="text-center">
            <h1>Welcome to QuixHR!</h1>
            <p>Hello ${data.name},</p>
            <p>Thanks for getting started with QuixHR! We're excited to have you on board.</p>
            <p>Please verify your email address to activate your account and access all features.</p>
            
            <a href="${data.verificationLink}" class="btn">Verify Email Address</a>
            
            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                <p class="text-sm text-muted">Or copy and paste this URL into your browser:</p>
                <p class="text-sm" style="word-break: break-all; color: #4f46e5;">${data.verificationLink}</p>
            </div>
            
            <p class="text-sm text-muted mt-4">If you didn't create an account with QuixHR, please ignore this email.</p>
        </div>
    `;

    return emailLayout({
        title: 'Verify Email',
        content,
    });
};
