import { LeaveGrade, LeavePolicy, LeaveRequest, LeaveType, LeaveStatus } from '@prisma/client';

export interface PaginationParams {
    page?: number;
    limit?: number;
    search?: string;
}

// --- Leave Grades ---
export type CreateLeaveGradeInput = Pick<LeaveGrade, 'companyId' | 'name'>;
export type UpdateLeaveGradeInput = Partial<Omit<CreateLeaveGradeInput, 'companyId'>>;

// --- Leave Policies ---
export type CreateLeavePolicyInput = Omit<LeavePolicy, 'id'>;
export type UpdateLeavePolicyInput = Partial<Omit<LeavePolicy, 'id' | 'leaveGradeId'>>;

// --- Leave Requests ---
export type CreateLeaveRequestInput = {
    employeeId: string;
    startDate: string; // ISO Date String
    endDate: string;   // ISO Date String
    type: LeaveType;
    reason?: string;
    dayDetails?: any;
};

export type UpdateLeaveRequestStatusInput = {
    status: LeaveStatus;
    approvedBy?: string; // ID of the approver
};
