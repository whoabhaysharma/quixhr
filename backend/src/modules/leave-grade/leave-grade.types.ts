import { LeaveType } from '@prisma/client';

export interface CreateLeaveGradeDTO {
    name: string;
}

export interface UpdateLeaveGradeDTO {
    name?: string;
}

export interface CreateLeavePolicyDTO {
    leaveType: LeaveType;
    totalDays: number;
    carryForward?: boolean;
    maxCarryAmount?: number;
}

export interface UpdateLeavePolicyDTO {
    totalDays?: number;
    carryForward?: boolean;
    maxCarryAmount?: number;
}

export interface LeaveGradeWithPolicies {
    id: string;
    name: string;
    companyId: string;
    policies: {
        id: string;
        leaveType: LeaveType;
        totalDays: number;
        carryForward: boolean;
        maxCarryAmount: number;
    }[];
    _count?: {
        employees: number;
    };
}
