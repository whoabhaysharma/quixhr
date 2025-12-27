/**
 * Notification Event Constants
 * 
 * Centralized event types and categories for the notification system
 */

export enum NotificationEvent {
    // Auth Events
    USER_REGISTERED = 'user.registered',
    EMAIL_VERIFIED = 'email.verified',
    PASSWORD_RESET = 'password.reset',
    LOGIN_ALERT = 'login.alert',

    // Attendance Events
    ATTENDANCE_CHECKED_IN = 'attendance.checked_in',
    ATTENDANCE_CHECKED_OUT = 'attendance.checked_out',
    ATTENDANCE_LATE = 'attendance.late',
    ATTENDANCE_MISSING = 'attendance.missing',

    // Employee Events
    EMPLOYEE_ADDED = 'employee.added',
    EMPLOYEE_STATUS_CHANGED = 'employee.status_changed',
    EMPLOYEE_PROFILE_UPDATED = 'employee.profile_updated',
    EMPLOYEE_ROLE_CHANGED = 'employee.role_changed',

    // Company Events
    COMPANY_CREATED = 'company.created',
    COMPANY_SETTINGS_UPDATED = 'company.settings_updated',
    COMPANY_MEMBER_JOINED = 'company.member_joined',

    // Calendar Events
    HOLIDAY_ADDED = 'holiday.added',
    HOLIDAY_UPDATED = 'holiday.updated',
    HOLIDAY_DELETED = 'holiday.deleted',
    HOLIDAY_UPCOMING = 'holiday.upcoming',

    // Leave Events (Future)
    LEAVE_REQUESTED = 'leave.requested',
    LEAVE_APPROVED = 'leave.approved',
    LEAVE_REJECTED = 'leave.rejected',
    LEAVE_CANCELLED = 'leave.cancelled',
}

export enum NotificationCategory {
    AUTH = 'auth',
    ATTENDANCE = 'attendance',
    EMPLOYEE = 'employee',
    COMPANY = 'company',
    CALENDAR = 'calendar',
    LEAVE = 'leave',
    SYSTEM = 'system',
}

export enum NotificationPriority {
    LOW = 0,
    NORMAL = 1,
    HIGH = 2,
    URGENT = 3,
}

export const EVENT_CATEGORY_MAP: Record<NotificationEvent, NotificationCategory> = {
    // Auth
    [NotificationEvent.USER_REGISTERED]: NotificationCategory.AUTH,
    [NotificationEvent.EMAIL_VERIFIED]: NotificationCategory.AUTH,
    [NotificationEvent.PASSWORD_RESET]: NotificationCategory.AUTH,
    [NotificationEvent.LOGIN_ALERT]: NotificationCategory.AUTH,

    // Attendance
    [NotificationEvent.ATTENDANCE_CHECKED_IN]: NotificationCategory.ATTENDANCE,
    [NotificationEvent.ATTENDANCE_CHECKED_OUT]: NotificationCategory.ATTENDANCE,
    [NotificationEvent.ATTENDANCE_LATE]: NotificationCategory.ATTENDANCE,
    [NotificationEvent.ATTENDANCE_MISSING]: NotificationCategory.ATTENDANCE,

    // Employee
    [NotificationEvent.EMPLOYEE_ADDED]: NotificationCategory.EMPLOYEE,
    [NotificationEvent.EMPLOYEE_STATUS_CHANGED]: NotificationCategory.EMPLOYEE,
    [NotificationEvent.EMPLOYEE_PROFILE_UPDATED]: NotificationCategory.EMPLOYEE,
    [NotificationEvent.EMPLOYEE_ROLE_CHANGED]: NotificationCategory.EMPLOYEE,

    // Company
    [NotificationEvent.COMPANY_CREATED]: NotificationCategory.COMPANY,
    [NotificationEvent.COMPANY_SETTINGS_UPDATED]: NotificationCategory.COMPANY,
    [NotificationEvent.COMPANY_MEMBER_JOINED]: NotificationCategory.COMPANY,

    // Calendar
    [NotificationEvent.HOLIDAY_ADDED]: NotificationCategory.CALENDAR,
    [NotificationEvent.HOLIDAY_UPDATED]: NotificationCategory.CALENDAR,
    [NotificationEvent.HOLIDAY_DELETED]: NotificationCategory.CALENDAR,
    [NotificationEvent.HOLIDAY_UPCOMING]: NotificationCategory.CALENDAR,

    // Leave
    [NotificationEvent.LEAVE_REQUESTED]: NotificationCategory.LEAVE,
    [NotificationEvent.LEAVE_APPROVED]: NotificationCategory.LEAVE,
    [NotificationEvent.LEAVE_REJECTED]: NotificationCategory.LEAVE,
    [NotificationEvent.LEAVE_CANCELLED]: NotificationCategory.LEAVE,
};

export const EVENT_PRIORITY_MAP: Record<NotificationEvent, NotificationPriority> = {
    // Auth - High priority
    [NotificationEvent.USER_REGISTERED]: NotificationPriority.HIGH,
    [NotificationEvent.EMAIL_VERIFIED]: NotificationPriority.HIGH,
    [NotificationEvent.PASSWORD_RESET]: NotificationPriority.HIGH,
    [NotificationEvent.LOGIN_ALERT]: NotificationPriority.URGENT,

    // Attendance - Normal priority
    [NotificationEvent.ATTENDANCE_CHECKED_IN]: NotificationPriority.NORMAL,
    [NotificationEvent.ATTENDANCE_CHECKED_OUT]: NotificationPriority.NORMAL,
    [NotificationEvent.ATTENDANCE_LATE]: NotificationPriority.HIGH,
    [NotificationEvent.ATTENDANCE_MISSING]: NotificationPriority.HIGH,

    // Employee - Normal to High
    [NotificationEvent.EMPLOYEE_ADDED]: NotificationPriority.HIGH,
    [NotificationEvent.EMPLOYEE_STATUS_CHANGED]: NotificationPriority.HIGH,
    [NotificationEvent.EMPLOYEE_PROFILE_UPDATED]: NotificationPriority.NORMAL,
    [NotificationEvent.EMPLOYEE_ROLE_CHANGED]: NotificationPriority.HIGH,

    // Company - Normal
    [NotificationEvent.COMPANY_CREATED]: NotificationPriority.HIGH,
    [NotificationEvent.COMPANY_SETTINGS_UPDATED]: NotificationPriority.NORMAL,
    [NotificationEvent.COMPANY_MEMBER_JOINED]: NotificationPriority.NORMAL,

    // Calendar - Low to Normal
    [NotificationEvent.HOLIDAY_ADDED]: NotificationPriority.NORMAL,
    [NotificationEvent.HOLIDAY_UPDATED]: NotificationPriority.LOW,
    [NotificationEvent.HOLIDAY_DELETED]: NotificationPriority.NORMAL,
    [NotificationEvent.HOLIDAY_UPCOMING]: NotificationPriority.NORMAL,

    // Leave - High priority
    [NotificationEvent.LEAVE_REQUESTED]: NotificationPriority.HIGH,
    [NotificationEvent.LEAVE_APPROVED]: NotificationPriority.HIGH,
    [NotificationEvent.LEAVE_REJECTED]: NotificationPriority.HIGH,
    [NotificationEvent.LEAVE_CANCELLED]: NotificationPriority.NORMAL,
};
