import { prisma } from '@/utils/prisma';
import { AppError } from '@/utils/appError';
import { Logger } from '@/utils/logger';
import { LeaveType } from '@prisma/client';
import { ParsedPagination } from '@/utils/pagination';
import { buildOrderBy, validateOrganizationResource } from '@/utils/prismaHelpers';
import {
    CreateLeaveAllocationInput,
    UpdateLeaveAllocationInput,
    BulkAllocateInput,
    GetAllocationsQuery,
} from './allocations.schema';

export class LeaveAllocationService {
    /**
     * Create a leave allocation
     */
    static async createAllocation(
        organizationId: string,
        data: CreateLeaveAllocationInput
    ) {
        // Validate employee belongs to organization
        await validateOrganizationResource('employee', data.employeeId!, organizationId, 'Employee');

        // Check if allocation already exists
        const existing = await prisma.leaveAllocation.findUnique({
            where: {
                employeeId_year_leaveType: {
                    employeeId: data.employeeId!,
                    year: data.year,
                    leaveType: data.leaveType,
                },
            },
        });

        if (existing) {
            throw new AppError('Allocation already exists for this employee, year, and leave type', 400);
        }

        return await prisma.leaveAllocation.create({
            data: {
                employeeId: data.employeeId!,
                year: data.year,
                leaveType: data.leaveType,
                allocated: data.allocated,
                used: 0,
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

    /**
     * Get allocations with filters
     */
    static async getAllocations(
        organizationId: string,
        pagination: ParsedPagination,
        filters: GetAllocationsQuery
    ) {
        const { page, limit, skip, sortBy, sortOrder } = pagination;
        const { employeeId, year, leaveType } = filters;

        const where: any = {
            employee: { organizationId },
        };

        if (employeeId) where.employeeId = employeeId;
        if (year) where.year = year;
        if (leaveType) where.leaveType = leaveType;

        const orderBy = buildOrderBy(sortBy, sortOrder, {
            allowedFields: ['year', 'leaveType', 'allocated', 'used', 'createdAt'],
            defaultSort: { year: 'desc' },
        });

        const [allocations, total] = await Promise.all([
            prisma.leaveAllocation.findMany({
                where,
                skip,
                take: limit,
                orderBy: orderBy as any,
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
            }),
            prisma.leaveAllocation.count({ where }),
        ]);

        return {
            data: allocations.map((alloc) => ({
                ...alloc,
                remaining: alloc.allocated - alloc.used,
            })),
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get allocation by ID
     */
    static async getAllocationById(organizationId: string, allocationId: string) {
        const allocation = await prisma.leaveAllocation.findUnique({
            where: { id: allocationId },
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

        if (!allocation) {
            throw new AppError('Allocation not found', 404);
        }

        // Validate organization access
        if (allocation.employee.organizationId !== organizationId) {
            throw new AppError('Access denied', 403);
        }

        return {
            ...allocation,
            remaining: allocation.allocated - allocation.used,
        };
    }

    /**
     * Update allocation
     */
    static async updateAllocation(
        organizationId: string,
        allocationId: string,
        data: UpdateLeaveAllocationInput
    ) {
        const allocation = await prisma.leaveAllocation.findUnique({
            where: { id: allocationId },
            include: { employee: true },
        });

        if (!allocation) {
            throw new AppError('Allocation not found', 404);
        }

        // Validate organization access
        if (allocation.employee.organizationId !== organizationId) {
            throw new AppError('Access denied', 403);
        }

        // Validate that used doesn't exceed allocated
        const newAllocated = data.allocated ?? allocation.allocated;
        const newUsed = data.used ?? allocation.used;

        if (newUsed > newAllocated) {
            throw new AppError('Used leave cannot exceed allocated leave', 400);
        }

        const updated = await prisma.leaveAllocation.update({
            where: { id: allocationId },
            data,
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

        return {
            ...updated,
            remaining: updated.allocated - updated.used,
        };
    }

    /**
     * Delete allocation
     */
    static async deleteAllocation(organizationId: string, allocationId: string) {
        const allocation = await prisma.leaveAllocation.findUnique({
            where: { id: allocationId },
            include: { employee: true },
        });

        if (!allocation) {
            throw new AppError('Allocation not found', 404);
        }

        // Validate organization access
        if (allocation.employee.organizationId !== organizationId) {
            throw new AppError('Access denied', 403);
        }

        // Check if allocation has been used
        if (allocation.used > 0) {
            throw new AppError('Cannot delete allocation that has been used', 400);
        }

        await prisma.leaveAllocation.delete({
            where: { id: allocationId },
        });

        return { message: 'Allocation deleted successfully' };
    }

    /**
     * Bulk allocate leaves based on leave grade policies
     */
    static async bulkAllocate(organizationId: string, data: BulkAllocateInput) {
        const { year, leaveGradeId, employeeIds } = data;

        // Build employee filter
        const employeeWhere: any = { organizationId };

        if (leaveGradeId) employeeWhere.leaveGradeId = leaveGradeId;
        if (employeeIds && employeeIds.length > 0) employeeWhere.id = { in: employeeIds };

        // Get employees with their leave grades
        const employees = await prisma.employee.findMany({
            where: employeeWhere,
            include: {
                leaveGrade: {
                    include: { policies: true },
                },
            },
        });

        if (employees.length === 0) {
            throw new AppError('No employees found matching the criteria', 404);
        }

        let allocatedCount = 0;
        const processedEmployees: string[] = [];

        // Process each employee
        for (const employee of employees) {
            if (!employee.leaveGrade) continue;

            // Create allocations for each policy
            for (const policy of employee.leaveGrade.policies) {
                try {
                    await prisma.leaveAllocation.upsert({
                        where: {
                            employeeId_year_leaveType: {
                                employeeId: employee.id,
                                year,
                                leaveType: policy.leaveType,
                            },
                        },
                        update: {
                            allocated: policy.totalDays,
                        },
                        create: {
                            employeeId: employee.id,
                            year,
                            leaveType: policy.leaveType,
                            allocated: policy.totalDays,
                            used: 0,
                        },
                    });
                    allocatedCount++;
                } catch (error: any) {
                    Logger.error(`Failed to allocate for employee ${employee.id}:`, { error: error.message });
                }
            }

            processedEmployees.push(employee.id);
        }

        return {
            allocated: allocatedCount,
            employees: processedEmployees,
        };
    }

    /**
     * Get allocations for a specific employee
     */
    static async getEmployeeAllocations(
        organizationId: string,
        employeeId: string,
        pagination: ParsedPagination,
        filters: Omit<GetAllocationsQuery, 'employeeId'>
    ) {
        // Validate employee belongs to organization
        await validateOrganizationResource('employee', employeeId, organizationId, 'Employee');

        const { page, limit, skip, sortBy, sortOrder } = pagination;
        const { year, leaveType } = filters;

        const where: any = { employeeId };

        if (year) where.year = year;
        if (leaveType) where.leaveType = leaveType;

        const orderBy = buildOrderBy(sortBy, sortOrder, {
            allowedFields: ['year', 'leaveType', 'allocated', 'used'],
            defaultSort: { year: 'desc' },
        });

        const [allocations, total] = await Promise.all([
            prisma.leaveAllocation.findMany({
                where,
                skip,
                take: limit,
                orderBy: orderBy as any,
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
            }),
            prisma.leaveAllocation.count({ where }),
        ]);

        return {
            data: allocations.map((alloc) => ({
                ...alloc,
                remaining: alloc.allocated - alloc.used,
            })),
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}
