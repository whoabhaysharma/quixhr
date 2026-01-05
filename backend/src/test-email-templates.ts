
import { inviteUserTemplate } from './infra/email/templates/invite-user.template';
import { leaveStatusTemplate } from './infra/email/templates/leave-status.template';
import { loginAlertTemplate } from './infra/email/templates/login-alert.template';
import { resetPasswordTemplate } from './infra/email/templates/reset-password.template';
import { verifyEmailTemplate } from './infra/email/templates/verify-email.template';
import fs from 'fs';
import path from 'path';

async function generatePreviews() {
    console.log('Generating email previews...');

    const previewsDir = path.join(__dirname, 'email-previews');
    if (!fs.existsSync(previewsDir)) {
        fs.mkdirSync(previewsDir);
    }

    const templates = [
        {
            name: 'invite-user',
            html: inviteUserTemplate({ inviteLink: 'http://localhost:3000/invite', organizationName: 'QuixHR Demo', role: 'EMPLOYEE' })
        },
        {
            name: 'leave-status-approved',
            html: leaveStatusTemplate({
                status: 'APPROVED',
                employeeName: 'John Doe',
                leaveType: 'ANNUAL',
                startDate: '2024-01-01',
                endDate: '2024-01-05',
                daysTaken: 5,
                organizationName: 'QuixHR Demo',
                reason: 'Family Vacation'
            })
        },
        {
            name: 'leave-status-rejected',
            html: leaveStatusTemplate({
                status: 'REJECTED',
                employeeName: 'John Doe',
                leaveType: 'SICK',
                startDate: '2024-02-01',
                endDate: '2024-02-01',
                daysTaken: 1,
                organizationName: 'QuixHR Demo',
                reason: 'Urgent Work'
            })
        },
        {
            name: 'login-alert',
            html: loginAlertTemplate({ name: 'John Doe', device: 'Chrome on Mac', time: new Date().toLocaleString() })
        },
        {
            name: 'reset-password',
            html: resetPasswordTemplate({ name: 'John Doe', resetLink: 'http://localhost:3000/reset', expiresIn: '1 hour' })
        },
        {
            name: 'verify-email',
            html: verifyEmailTemplate({ name: 'John Doe', verificationLink: 'http://localhost:3000/verify' })
        }
    ];

    for (const t of templates) {
        fs.writeFileSync(path.join(previewsDir, `${t.name}.html`), t.html);
        console.log(`Generated ${t.name}.html`);
    }

    console.log('Done!');
}

generatePreviews().catch(console.error);
