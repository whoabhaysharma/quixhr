import { NotificationType } from './notification.types';
import { NotificationEvent } from './notification.events';
import { format } from 'date-fns';

/**
 * Notification Message Templates
 * 
 * Centralized message generation for all notification types
 */

export interface NotificationMessage {
    title: string;
    message: string;
    type: NotificationType;
    actionUrl?: string;
}

/**
 * Auth Notification Messages
 */
export const authMessages = {
    registered: (name: string): NotificationMessage => ({
        title: 'Welcome to QuixHR! 🎉',
        message: `Hi ${name}! Your account has been created successfully. Please verify your email to get started.`,
        type: 'INFO',
    }),

    emailVerified: (name: string): NotificationMessage => ({
        title: 'Email Verified Successfully ✓',
        message: `Welcome aboard, ${name}! Your email has been verified. You can now access all features.`,
        type: 'SUCCESS',
    }),

    passwordReset: (): NotificationMessage => ({
        title: 'Password Reset Successful 🔒',
        message: 'Your password has been reset successfully. You can now log in with your new password.',
        type: 'SUCCESS',
    }),

    loginAlert: (ipAddress: string, timestamp: Date): NotificationMessage => ({
        title: 'New Login Detected 🔐',
        message: `A new login was detected from IP ${ipAddress} at ${format(timestamp, 'PPpp')}. If this wasn't you, please reset your password immediately.`,
        type: 'WARNING',
        actionUrl: '/settings/security',
    }),
};

/**
 * Attendance Notification Messages
 */
export const attendanceMessages = {
    checkedIn: (timestamp: Date): NotificationMessage => ({
        title: 'Checked In Successfully ✓',
        message: `You've checked in at ${format(timestamp, 'p')}. Have a productive day!`,
        type: 'SUCCESS',
    }),

    checkedOut: (checkInTime: Date, checkOutTime: Date, hoursWorked: number): NotificationMessage => ({
        title: 'Checked Out Successfully ✓',
        message: `You've checked out at ${format(checkOutTime, 'p')}. Total hours worked: ${hoursWorked.toFixed(2)} hours.`,
        type: 'SUCCESS',
    }),

    lateCheckIn: (timestamp: Date, expectedTime: string): NotificationMessage => ({
        title: 'Late Check-In ⚠️',
        message: `You checked in at ${format(timestamp, 'p')}, which is later than the expected time of ${expectedTime}.`,
        type: 'WARNING',
    }),

    missingAttendance: (date: Date): NotificationMessage => ({
        title: 'Missing Attendance Record ⚠️',
        message: `You haven't marked your attendance for ${format(date, 'PP')}. Please check in or contact HR.`,
        type: 'WARNING',
        actionUrl: '/attendance',
    }),
};

/**
 * Employee Notification Messages
 */
export const employeeMessages = {
    added: (name: string, companyName: string): NotificationMessage => ({
        title: 'Welcome to the Team! 👋',
        message: `Hi ${name}! You've been added to ${companyName}. Complete your profile to get started.`,
        type: 'INFO',
        actionUrl: '/profile',
    }),

    statusChanged: (newStatus: string): NotificationMessage => ({
        title: 'Employment Status Updated',
        message: `Your employment status has been changed to ${newStatus}.`,
        type: 'INFO',
    }),

    profileUpdated: (): NotificationMessage => ({
        title: 'Profile Updated Successfully ✓',
        message: 'Your profile information has been updated.',
        type: 'SUCCESS',
    }),

    roleChanged: (newRole: string): NotificationMessage => ({
        title: 'Role Updated 🎯',
        message: `Your role has been updated to ${newRole}. Your permissions have been adjusted accordingly.`,
        type: 'INFO',
    }),
};

/**
 * Company Notification Messages
 */
export const companyMessages = {
    created: (companyName: string): NotificationMessage => ({
        title: 'Company Created Successfully 🏢',
        message: `${companyName} has been created. You can now add employees and configure settings.`,
        type: 'SUCCESS',
        actionUrl: '/company/settings',
    }),

    settingsUpdated: (updatedBy: string): NotificationMessage => ({
        title: 'Company Settings Updated',
        message: `Company settings have been updated by ${updatedBy}.`,
        type: 'INFO',
    }),

    memberJoined: (memberName: string, role: string): NotificationMessage => ({
        title: 'New Team Member 👥',
        message: `${memberName} has joined as ${role}.`,
        type: 'INFO',
        actionUrl: '/manage/members',
    }),
};

/**
 * Calendar/Holiday Notification Messages
 */
export const calendarMessages = {
    holidayAdded: (holidayName: string, date: Date): NotificationMessage => ({
        title: 'New Holiday Added 🎉',
        message: `${holidayName} has been added on ${format(date, 'PPP')}.`,
        type: 'INFO',
        actionUrl: '/holidays',
    }),

    holidayUpdated: (holidayName: string, newDate: Date): NotificationMessage => ({
        title: 'Holiday Updated 📅',
        message: `${holidayName} has been rescheduled to ${format(newDate, 'PPP')}.`,
        type: 'INFO',
        actionUrl: '/holidays',
    }),

    holidayDeleted: (holidayName: string): NotificationMessage => ({
        title: 'Holiday Removed',
        message: `${holidayName} has been removed from the calendar.`,
        type: 'INFO',
    }),

    holidayUpcoming: (holidayName: string, date: Date, daysUntil: number): NotificationMessage => ({
        title: 'Upcoming Holiday 🎊',
        message: `${holidayName} is coming up in ${daysUntil} day${daysUntil > 1 ? 's' : ''} on ${format(date, 'PPP')}.`,
        type: 'INFO',
        actionUrl: '/holidays',
    }),
};

/**
 * Leave Notification Messages (Future)
 */
export const leaveMessages = {
    requested: (startDate: Date, endDate: Date, days: number): NotificationMessage => ({
        title: 'Leave Request Submitted 📝',
        message: `Your leave request for ${days} day${days > 1 ? 's' : ''} (${format(startDate, 'PP')} - ${format(endDate, 'PP')}) has been submitted for approval.`,
        type: 'INFO',
        actionUrl: '/leaves',
    }),

    approved: (startDate: Date, endDate: Date, approvedBy: string): NotificationMessage => ({
        title: 'Leave Request Approved ✓',
        message: `Your leave request (${format(startDate, 'PP')} - ${format(endDate, 'PP')}) has been approved by ${approvedBy}.`,
        type: 'SUCCESS',
        actionUrl: '/leaves',
    }),

    rejected: (startDate: Date, endDate: Date, rejectedBy: string, reason?: string): NotificationMessage => ({
        title: 'Leave Request Rejected ✗',
        message: `Your leave request (${format(startDate, 'PP')} - ${format(endDate, 'PP')}) has been rejected by ${rejectedBy}.${reason ? ` Reason: ${reason}` : ''}`,
        type: 'ERROR',
        actionUrl: '/leaves',
    }),

    cancelled: (startDate: Date, endDate: Date): NotificationMessage => ({
        title: 'Leave Request Cancelled',
        message: `Your leave request (${format(startDate, 'PP')} - ${format(endDate, 'PP')}) has been cancelled.`,
        type: 'INFO',
    }),
};

/**
 * Get notification message by event type
 */
export function getNotificationMessage(
    event: NotificationEvent,
    data: any
): NotificationMessage {
    switch (event) {
        // Auth
        case NotificationEvent.USER_REGISTERED:
            return authMessages.registered(data.name);
        case NotificationEvent.EMAIL_VERIFIED:
            return authMessages.emailVerified(data.name);
        case NotificationEvent.PASSWORD_RESET:
            return authMessages.passwordReset();
        case NotificationEvent.LOGIN_ALERT:
            return authMessages.loginAlert(data.ipAddress, data.timestamp);

        // Attendance
        case NotificationEvent.ATTENDANCE_CHECKED_IN:
            return attendanceMessages.checkedIn(data.timestamp);
        case NotificationEvent.ATTENDANCE_CHECKED_OUT:
            return attendanceMessages.checkedOut(data.checkInTime, data.checkOutTime, data.hoursWorked);
        case NotificationEvent.ATTENDANCE_LATE:
            return attendanceMessages.lateCheckIn(data.timestamp, data.expectedTime);
        case NotificationEvent.ATTENDANCE_MISSING:
            return attendanceMessages.missingAttendance(data.date);

        // Employee
        case NotificationEvent.EMPLOYEE_ADDED:
            return employeeMessages.added(data.name, data.companyName);
        case NotificationEvent.EMPLOYEE_STATUS_CHANGED:
            return employeeMessages.statusChanged(data.newStatus);
        case NotificationEvent.EMPLOYEE_PROFILE_UPDATED:
            return employeeMessages.profileUpdated();
        case NotificationEvent.EMPLOYEE_ROLE_CHANGED:
            return employeeMessages.roleChanged(data.newRole);

        // Company
        case NotificationEvent.COMPANY_CREATED:
            return companyMessages.created(data.companyName);
        case NotificationEvent.COMPANY_SETTINGS_UPDATED:
            return companyMessages.settingsUpdated(data.updatedBy);
        case NotificationEvent.COMPANY_MEMBER_JOINED:
            return companyMessages.memberJoined(data.memberName, data.role);

        // Calendar
        case NotificationEvent.HOLIDAY_ADDED:
            return calendarMessages.holidayAdded(data.holidayName, data.date);
        case NotificationEvent.HOLIDAY_UPDATED:
            return calendarMessages.holidayUpdated(data.holidayName, data.newDate);
        case NotificationEvent.HOLIDAY_DELETED:
            return calendarMessages.holidayDeleted(data.holidayName);
        case NotificationEvent.HOLIDAY_UPCOMING:
            return calendarMessages.holidayUpcoming(data.holidayName, data.date, data.daysUntil);

        // Leave
        case NotificationEvent.LEAVE_REQUESTED:
            return leaveMessages.requested(data.startDate, data.endDate, data.days);
        case NotificationEvent.LEAVE_APPROVED:
            return leaveMessages.approved(data.startDate, data.endDate, data.approvedBy);
        case NotificationEvent.LEAVE_REJECTED:
            return leaveMessages.rejected(data.startDate, data.endDate, data.rejectedBy, data.reason);
        case NotificationEvent.LEAVE_CANCELLED:
            return leaveMessages.cancelled(data.startDate, data.endDate);

        default:
            return {
                title: 'Notification',
                message: 'You have a new notification',
                type: 'INFO',
            };
    }
}
