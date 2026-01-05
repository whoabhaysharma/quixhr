import { emailLayout } from './email.layout';

export const resetPasswordTemplate = (data: { name: string; resetLink: string; expiresIn: string }) => {
    const content = `
        <div class="text-center">
            <h1>Reset Your Password</h1>
            <p>Hello ${data.name || 'User'},</p>
            <p>We received a request to reset your password for your QuixHR account. If you didn't make this request, you can safely ignore this email.</p>
            
            <a href="${data.resetLink}" class="btn">Reset Password</a>
            
            <p class="text-sm text-muted">This password reset link will expire in <strong>${data.expiresIn}</strong>.</p>
            
            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                <p class="text-sm text-muted">Or copy and paste this URL into your browser:</p>
                <p class="text-sm" style="word-break: break-all; color: #4f46e5;">${data.resetLink}</p>
            </div>
        </div>
    `;

    return emailLayout({
        title: 'Reset Password',
        content,
    });
};
