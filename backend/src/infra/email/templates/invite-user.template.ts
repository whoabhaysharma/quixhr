import { emailLayout } from './email.layout';

export const inviteUserTemplate = (data: { inviteLink: string; organizationName: string; role: string }) => {
    const content = `
        <div class="text-center">
            <h1>Join ${data.organizationName}</h1>
            <p>You have been invited to join <strong>${data.organizationName}</strong> on QuixHR.</p>
            
            <div class="highlight-box" style="text-align: center;">
                <p style="margin: 0; font-size: 14px; color: #64748b;">Assigned Role</p>
                <p style="margin: 4px 0 0; font-size: 18px; font-weight: 700; color: #1e293b;">${data.role}</p>
            </div>

            <p>Click the button below to set up your account and get started.</p>
            
            <a href="${data.inviteLink}" class="btn">Accept Invitation</a>
            
            <p class="text-sm text-muted">This invitation link will expire in 7 days.</p>
            <p class="text-sm text-muted">If you were not expecting this invitation, you can simply ignore this email.</p>
        </div>
    `;

    return emailLayout({
        title: `Invitation to join ${data.organizationName}`,
        content,
    });
};
