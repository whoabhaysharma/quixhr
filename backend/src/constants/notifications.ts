/**
 * Notification Constants
 * 
 * All notification types and message templates
 */

export enum NotificationType {
    // Leave Management
    LEAVE_REQUEST_CREATED = 'LEAVE_REQUEST_CREATED',
    LEAVE_REQUEST_APPROVED = 'LEAVE_REQUEST_APPROVED',
    LEAVE_REQUEST_REJECTED = 'LEAVE_REQUEST_REJECTED',

    // Invitations
    INVITATION_RECEIVED = 'INVITATION_RECEIVED',
    INVITATION_ACCEPTED = 'INVITATION_ACCEPTED',
}

export interface NotificationMessage {
    title: string;
    message: string;
}

export interface LeaveRequestCreatedData {
    employeeName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    daysTaken: number;
}

export interface LeaveRequestStatusData {
    leaveType: string;
    startDate: string;
    endDate: string;
    daysTaken: number;
    approverName?: string;
}

export interface InvitationReceivedData {
    organizationName: string;
    role: string;
}

export interface InvitationAcceptedData {
    employeeName: string;
    email: string;
}

/**
 * Generate notification message based on type and data
 */
export const generateNotificationMessage = (
    type: NotificationType,
    data: any
): NotificationMessage => {
    switch (type) {
        case NotificationType.LEAVE_REQUEST_CREATED:
            const createdData = data as LeaveRequestCreatedData;
            return {
                title: 'New Leave Request',
                message: `${createdData.employeeName} has requested ${createdData.daysTaken} day(s) of ${createdData.leaveType} leave from ${createdData.startDate} to ${createdData.endDate}. Please review and approve or reject this request.`
            };

        case NotificationType.LEAVE_REQUEST_APPROVED:
            const approvedData = data as LeaveRequestStatusData;
            return {
                title: 'Leave Request Approved',
                message: `Great news! Your ${approvedData.leaveType} leave request from ${approvedData.startDate} to ${approvedData.endDate} has been approved.`
            };

        case NotificationType.LEAVE_REQUEST_REJECTED:
            const rejectedData = data as LeaveRequestStatusData;
            return {
                title: 'Leave Request Rejected',
                message: `Unfortunately, your ${rejectedData.leaveType} leave request from ${rejectedData.startDate} to ${rejectedData.endDate} has been rejected. Please contact your manager for more details.`
            };

        case NotificationType.INVITATION_RECEIVED:
            const inviteData = data as InvitationReceivedData;
            return {
                title: 'New Invitation',
                message: `You have been invited to join ${inviteData.organizationName} as ${inviteData.role}.`
            };

        case NotificationType.INVITATION_ACCEPTED:
            const acceptedData = data as InvitationAcceptedData;
            return {
                title: 'Invitation Accepted',
                message: `${acceptedData.employeeName} (${acceptedData.email}) has accepted your invitation and joined the organization.`
            };

        default:
            return {
                title: 'Notification',
                message: 'You have a new notification.'
            };
    }
};
