export interface EmailPayload {
    to: string;
    subject: string;
    template: EmailTemplate;
    data: Record<string, any>;
}

export enum EmailTemplate {
    LOGIN_ALERT = 'login-alert',
    RESET_PASSWORD = 'reset-password',
    LEAVE_APPROVED = 'leave-approved',
    LEAVE_REJECTED = 'leave-rejected',
    ATTENDANCE_REMINDER = 'attendance-reminder',
    WELCOME = 'welcome',
}

export interface NotificationJob {
    type: 'email';
    payload: EmailPayload;
}
