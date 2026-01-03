import { prisma } from '@/utils/prisma';
import { AppError } from '@/utils/appError';
import { LeaveStatus, LeaveType } from '@prisma/client';
import { ParsedPagination } from '@/utils/pagination';
import { buildOrderBy, validateOrganizationResource } from '@/utils/prismaHelpers';
import {
    CreateLeaveGradeInput,
    UpdateLeaveGradeInput,
    CreateLeavePolicyInput,
    UpdateLeavePolicyInput,
    CreateLeaveRequestInput,
    UpdateLeaveRequestStatusInput,
    LeaveRequestQuery,
    LeaveGradeQuery,
} from './leaves.schema';

export class LeaveService {
    // =========================================================================
    // LEAVE GRADES
    // =========================================================================

    static async createGrade(organizationId: string, data: CreateLeaveGradeInput) {
        return await prisma.leaveGrade.create({
            data: {
                ...data,
                organizationId,
            },
            include: { policies: true },
        });
    }

    static async getGrades(
        organizationId: string,
        pagination: ParsedPagination,
        filters: LeaveGradeQuery
    ) {
        const { page, limit, skip, sortBy, sortOrder, search } = pagination;

        const where: any = { organizationId };
        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }

        const orderBy = buildOrderBy(sortBy, sortOrder, {
            allowedFields: ['name', 'createdAt'],
            defaultSort: { name: 'asc' },
        });

        const [data, total] = await Promise.all([
            prisma.leaveGrade.findMany({
                where,
                include: { policies: true },
                orderBy: orderBy as any,
                skip,
                take: limit,
            }),
            prisma.leaveGrade.count({ where }),
        ]);

        return {
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    static async getGradeById(organizationId: string, gradeId: string) {
        await validateOrganizationResource('leaveGrade', gradeId, organizationId, 'Leave Grade');

        return await prisma.leaveGrade.findUnique({
            where: { id: gradeId },
            include: { policies: true },
        });
    }

    static async updateGrade(
        organizationId: string,
        gradeId: string,
        data: UpdateLeaveGradeInput
    ) {
        await validateOrganizationResource('leaveGrade', gradeId, organizationId, 'Leave Grade');

        return await prisma.leaveGrade.update({
            where: { id: gradeId },
            data,
            include: { policies: true },
        });
    }

    static async deleteGrade(organizationId: string, gradeId: string) {
        await validateOrganizationResource('leaveGrade', gradeId, organizationId, 'Leave Grade');

        // Check if grade is assigned to employees
        const employeeCount = await prisma.employee.count({
            where: { leaveGradeId: gradeId },
        });

        if (employeeCount > 0) {
            throw new AppError(
                `Cannot delete leave grade assigned to ${employeeCount} employee(s)`,
                400
            );
        }

        await prisma.leaveGrade.delete({ where: { id: gradeId } });
    }

    // =========================================================================
    // LEAVE POLICIES
    // =========================================================================

    static async createPolicy(
        organizationId: string,
        gradeId: string,
        data: CreateLeavePolicyInput
    ) {
        await validateOrganizationResource('leaveGrade', gradeId, organizationId, 'Leave Grade');

        return await prisma.leavePolicy.create({
            data: {
                ...data,
                leaveGradeId: gradeId,
            },
        });
    }

    static async getPolicies(organizationId: string, gradeId: string) {
        await validateOrganizationResource('leaveGrade', gradeId, organizationId, 'Leave Grade');

        return await prisma.leavePolicy.findMany({
            where: { leaveGradeId: gradeId },
            orderBy: { leaveType: 'asc' },
        });
    }

    static async updatePolicy(
        organizationId: string,
        gradeId: string,
        policyId: string,
        data: UpdateLeavePolicyInput
    ) {
        await validateOrganizationResource('leaveGrade', gradeId, organizationId, 'Leave Grade');

        const policy = await prisma.leavePolicy.findUnique({
            where: { id: policyId },
        });

        if (!policy || policy.leaveGradeId !== gradeId) {
            throw new AppError('Policy not found', 404);
        }

        return await prisma.leavePolicy.update({
            where: { id: policyId },
            data,
        });
    }

    static async deletePolicy(organizationId: string, gradeId: string, policyId: string) {
        await validateOrganizationResource('leaveGrade', gradeId, organizationId, 'Leave Grade');

        const policy = await prisma.leavePolicy.findUnique({
            where: { id: policyId },
        });

        if (!policy || policy.leaveGradeId !== gradeId) {
            throw new AppError('Policy not found', 404);
        }

        await prisma.leavePolicy.delete({ where: { id: policyId } });
    }

    // =========================================================================
    // LEAVE REQUESTS
    // =========================================================================

    static async createRequest(
        organizationId: string,
        employeeId: string,
        data: CreateLeaveRequestInput
    ) {
        await validateOrganizationResource('employee', employeeId, organizationId, 'Employee');

        // Calculate days taken (simplified - should account for weekends/holidays)
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const daysTaken = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        return await prisma.leaveRequest.create({
            data: {
                employeeId,
                startDate: start,
                endDate: end,
                type: data.type,
                reason: data.reason,
                daysTaken,
                status: LeaveStatus.PENDING,
                dayDetails: data.dayDetails ?? undefined,
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        code: true,
                    },
                },
            },
        });
    }

    static async getRequests(
        organizationId: string,
        pagination: ParsedPagination,
        filters: LeaveRequestQuery
    ) {
        const { page, limit, skip, sortBy, sortOrder } = pagination;
        const { employeeId, status, type, startDate, endDate } = filters;

        const where: any = {
            employee: { organizationId },
        };

        if (employeeId) where.employeeId = employeeId;
        if (status) where.status = status;
        if (type) where.type = type;
        if (startDate && endDate) {
            where.startDate = { gte: new Date(startDate) };
            where.endDate = { lte: new Date(endDate) };
        }

        const orderBy = buildOrderBy(sortBy, sortOrder, {
            allowedFields: ['startDate', 'endDate', 'type', 'status', 'createdAt'],
            defaultSort: { createdAt: 'desc' },
        });

        const [data, total] = await Promise.all([
            prisma.leaveRequest.findMany({
                where,
                include: {
                    employee: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            code: true,
                        },
                    },
                },
                orderBy: orderBy as any,
                skip,
                take: limit,
            }),
            prisma.leaveRequest.count({ where }),
        ]);

        return {
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    static async getRequestById(organizationId: string, requestId: string) {
        const request = await prisma.leaveRequest.findUnique({
            where: { id: requestId },
            include: {
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        code: true,
                        organizationId: true,
                    },
                },
            },
        });

        if (!request) {
            throw new AppError('Leave request not found', 404);
        }

        if (request.employee.organizationId !== organizationId) {
            throw new AppError('Access denied', 403);
        }

        return request;
    }

    static async updateRequestStatus(
        organizationId: string,
        requestId: string,
        data: UpdateLeaveRequestStatusInput,
        approvedBy?: string
    ) {
        const request = await this.getRequestById(organizationId, requestId);

        if (request.status !== LeaveStatus.PENDING) {
            throw new AppError('Only pending requests can be updated', 400);
        }

        return await prisma.leaveRequest.update({
            where: { id: requestId },
            data: {
                status: data.status,
                approvedBy,
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        code: true,
                    },
                },
            },
        });
    }
}
