import { prisma } from '@/utils/prisma';
import { AppError } from '@/utils/appError';
import { LeaveType } from '@prisma/client';
import {
    CreateLeaveAllocationInput,
    UpdateLeaveAllocationInput,
    BulkAllocateInput,
    LeaveAllocationFilters,
} from './allocations.types';

export class LeaveAllocationService {
    /**
     * Create a leave allocation
     */
    static async createAllocation(data: CreateLeaveAllocationInput, organizationId: string) {
        // Verify employee belongs to organization
        const employee = await prisma.employee.findUnique({
            where: { id: data.employeeId },
        });

        if (!employee) {
            throw new AppError('Employee not found', 404);
        }

        if (employee.organizationId !== organizationId) {
            throw new AppError('Employee does not belong to this organization', 403);
        }

        // Check if allocation already exists
        const existing = await prisma.leaveAllocation.findUnique({
            where: {
                employeeId_year_leaveType: {
                    employeeId: data.employeeId,
                    year: data.year,
                    leaveType: data.leaveType,
                },
            },
        });

        if (existing) {
            throw new AppError('Allocation already exists for this employee, year, and leave type', 400);
        }

        const allocation = await prisma.leaveAllocation.create({
            data: {
                employeeId: data.employeeId,
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

        return allocation;
    }

    /**
     * Get allocations with filters
     */
    static async getAllocations(organizationId: string, filters: LeaveAllocationFilters) {
        const { employeeId, year, leaveType, page = 1, limit = 20 } = filters;
        const skip = (page - 1) * limit;

        const whereClause: any = {
            employee: {
                organizationId,
            },
        };

        if (employeeId) {
            whereClause.employeeId = employeeId;
        }

        if (year) {
            whereClause.year = year;
        }

        if (leaveType) {
            whereClause.leaveType = leaveType;
        }

        const [allocations, total] = await Promise.all([
            prisma.leaveAllocation.findMany({
                where: whereClause,
                skip,
                take: limit,
                orderBy: [{ year: 'desc' }, { employeeId: 'asc' }],
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
            prisma.leaveAllocation.count({ where: whereClause }),
        ]);

        return {
            allocations: allocations.map((alloc) => ({
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
    static async getAllocationById(allocationId: string, organizationId: string, userRole: string) {
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
        if (userRole !== 'SUPER_ADMIN' && allocation.employee.organizationId !== organizationId) {
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
        allocationId: string,
        data: UpdateLeaveAllocationInput,
        organizationId: string,
        userRole: string
    ) {
        const allocation = await prisma.leaveAllocation.findUnique({
            where: { id: allocationId },
            include: {
                employee: true,
            },
        });

        if (!allocation) {
            throw new AppError('Allocation not found', 404);
        }

        // Validate organization access
        if (userRole !== 'SUPER_ADMIN' && allocation.employee.organizationId !== organizationId) {
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
    static async deleteAllocation(allocationId: string, organizationId: string, userRole: string) {
        const allocation = await prisma.leaveAllocation.findUnique({
            where: { id: allocationId },
            include: {
                employee: true,
            },
        });

        if (!allocation) {
            throw new AppError('Allocation not found', 404);
        }

        // Validate organization access
        if (userRole !== 'SUPER_ADMIN' && allocation.employee.organizationId !== organizationId) {
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
        const employeeWhere: any = {
            organizationId,
        };

        if (leaveGradeId) {
            employeeWhere.leaveGradeId = leaveGradeId;
        }

        if (employeeIds && employeeIds.length > 0) {
            employeeWhere.id = { in: employeeIds };
        }

        // Get employees with their leave grades
        const employees = await prisma.employee.findMany({
            where: employeeWhere,
            include: {
                leaveGrade: {
                    include: {
                        policies: true,
                    },
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
            if (!employee.leaveGrade) {
                continue; // Skip employees without leave grade
            }

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
                } catch (error) {
                    // Continue on error for individual allocations
                    console.error(`Failed to allocate for employee ${employee.id}:`, error);
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
        employeeId: string,
        userOrganizationId: string,
        userRole: string,
        requestingEmployeeId?: string,
        filters: Omit<LeaveAllocationFilters, 'employeeId'> = {}
    ) {
        // Verify employee exists and get their organization
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            select: { organizationId: true },
        });

        if (!employee) {
            throw new AppError('Employee not found', 404);
        }

        // Authorization: SUPER_ADMIN can access any, others only their organization
        // EMPLOYEE role can only access their own allocations
        if (userRole !== 'SUPER_ADMIN') {
            if (employee.organizationId !== userOrganizationId) {
                throw new AppError('Access denied', 403);
            }

            // If user is EMPLOYEE role, they can only view their own allocations
            if (userRole === 'EMPLOYEE' && employeeId !== requestingEmployeeId) {
                throw new AppError('Employees can only view their own allocations', 403);
            }
        }

        const { year, leaveType, page = 1, limit = 20 } = filters;
        const skip = (page - 1) * limit;

        const whereClause: any = {
            employeeId,
        };

        if (year) {
            whereClause.year = year;
        }

        if (leaveType) {
            whereClause.leaveType = leaveType;
        }

        const [allocations, total] = await Promise.all([
            prisma.leaveAllocation.findMany({
                where: whereClause,
                skip,
                take: limit,
                orderBy: [{ year: 'desc' }, { leaveType: 'asc' }],
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
            prisma.leaveAllocation.count({ where: whereClause }),
        ]);

        return {
            allocations: allocations.map((alloc) => ({
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
