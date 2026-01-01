import { prisma } from '@/utils/prisma';
import { LeaveStatus, LeaveType } from '@prisma/client';
import {
    PaginationParams,
    CreateLeaveGradeInput,
    UpdateLeaveGradeInput,
    CreateLeavePolicyInput,
    UpdateLeavePolicyInput,
    CreateLeaveRequestInput,
    UpdateLeaveRequestStatusInput
} from './leaves.types';

// =========================================================================
// 1. LEAVE GRADES (Configuration)
// =========================================================================

export const createGrade = async (data: CreateLeaveGradeInput) => {
    return await prisma.leaveGrade.create({
        data,
        include: { policies: true }
    });
};

export const findGradeById = async (id: string) => {
    return await prisma.leaveGrade.findUnique({
        where: { id },
        include: { policies: true }
    });
};

interface LeaveGradeFilter extends PaginationParams {
    companyId?: string;
}

export const findAllGrades = async (filter: LeaveGradeFilter = {}) => {
    const { companyId, page = 1, limit = 10, search } = filter;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (companyId) where.companyId = companyId;
    if (search) {
        where.name = { contains: search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
        prisma.leaveGrade.findMany({
            where,
            include: { policies: true },
            orderBy: { name: 'asc' },
            skip,
            take: limit,
        }),
        prisma.leaveGrade.count({ where })
    ]);

    return {
        data,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
};

export const updateGrade = async (id: string, data: UpdateLeaveGradeInput) => {
    return await prisma.leaveGrade.update({
        where: { id },
        data,
        include: { policies: true }
    });
};

export const deleteGrade = async (id: string) => {
    return await prisma.leaveGrade.delete({
        where: { id }
    });
};

// =========================================================================
// 2. LEAVE POLICIES (Rules)
// =========================================================================

export const createPolicy = async (data: CreateLeavePolicyInput) => {
    return await prisma.leavePolicy.create({ data });
};

export const findPolicies = async (leaveGradeId: string) => {
    return await prisma.leavePolicy.findMany({
        where: { leaveGradeId },
        orderBy: { leaveType: 'asc' }
    });
};

export const findPolicyById = async (id: string) => {
    return await prisma.leavePolicy.findUnique({
        where: { id },
        include: { grade: true }
    });
};

export const updatePolicy = async (id: string, data: UpdateLeavePolicyInput) => {
    return await prisma.leavePolicy.update({
        where: { id },
        data
    });
};

export const deletePolicy = async (id: string) => {
    return await prisma.leavePolicy.delete({ where: { id } });
};

// =========================================================================
// 3. LEAVE REQUESTS (Runtime)
// =========================================================================

export const createRequest = async (data: CreateLeaveRequestInput) => {
    // Basic calculation of daysTaken could happen here, or be passed in. 
    // For now, we assume simple logic or frontend passes it, 
    // BUT typically backend should validate dates.
    // Simplifying for now: default to 0 and let business logic expand later.

    // Calculate days diff roughly
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const daysTaken = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Inclusive

    return await prisma.leaveRequest.create({
        data: {
            employeeId: data.employeeId,
            startDate: start,
            endDate: end,
            type: data.type,
            reason: data.reason,
            daysTaken: daysTaken, // This needs sophisticated logic later (holidays/weekends)
            status: LeaveStatus.PENDING,
            dayDetails: data.dayDetails ?? undefined
        }
    });
};

interface LeaveRequestFilter extends PaginationParams {
    employeeId?: string;
    companyId?: string;
    status?: LeaveStatus;
    type?: LeaveType;
}

export const findAllRequests = async (filter: LeaveRequestFilter = {}) => {
    const { employeeId, companyId, status, type, page = 1, limit = 10 } = filter;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;
    if (type) where.type = type;

    // Admin view: Filter by company via relation
    if (companyId) {
        where.employee = { companyId };
    }

    const [data, total] = await Promise.all([
        prisma.leaveRequest.findMany({
            where,
            include: { employee: true }, // Include employee info for Admin view
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        }),
        prisma.leaveRequest.count({ where })
    ]);

    return {
        data,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
};

export const findRequestById = async (id: string) => {
    return await prisma.leaveRequest.findUnique({
        where: { id },
        include: { employee: true }
    });
};

export const updateRequestStatus = async (id: string, data: UpdateLeaveRequestStatusInput) => {
    return await prisma.leaveRequest.update({
        where: { id },
        data: {
            status: data.status,
            approvedBy: data.approvedBy
        }
    });
};
