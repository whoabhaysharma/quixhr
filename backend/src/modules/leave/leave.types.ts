import { LeaveStatus, LeaveType } from '@prisma/client';

export interface LeaveBalance {
    leaveType: LeaveType;
    leaveTypeName: string;
    allocated: number;
    used: number;
    balance: number;
}

export interface ApplyLeaveDTO {
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    reason: string;
    isHalfDay?: boolean;
}

export interface LeaveRequestFilters {
    status?: LeaveStatus;
    employeeId?: string;
    startDate?: string;
    endDate?: string;
}

export interface ApproveRejectDTO {
    status: 'APPROVED' | 'REJECTED';
    remarks?: string;
}

export interface AdjustLeaveDTO {
    employeeId: string;
    leaveType: LeaveType;
    amount: number;  // Positive for credit, negative for debit
    reason: string;
    effectiveDate?: string;
}

export interface ImportLeaveDTO {
    records: Array<{
        employeeCode: string;
        leaveType: LeaveType;
        allocated: number;
        used?: number;
        year: number;
    }>;
}

export interface LeaveLedgerEntry {
    id: string;
    createdAt: Date;
    event: 'ACCRUAL' | 'CONSUMPTION' | 'ADJUSTMENT' | 'IMPORT' | 'EXPIRY';
    amount: number;
    remarks: string | null;
    leaveRequestId?: string | null;
}
