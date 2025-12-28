
import { LeaveDuration, LeaveStatus, LeaveType } from '@prisma/client';

export interface CreateLeaveDto {
    startDate: string; // ISO Date String
    endDate: string;   // ISO Date String
    duration: LeaveDuration;
    type: LeaveType;
    reason?: string;
}

export interface UpdateLeaveStatusDto {
    status: LeaveStatus;
    reason?: string; // Rejection reason?
}

export interface LeaveQueryDto {
    status?: LeaveStatus;
    employeeId?: string;
    startDate?: string;
    endDate?: string;
}
