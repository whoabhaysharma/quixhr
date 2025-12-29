import prisma from '@/utils/prisma';
import { AppError } from '@/utils/appError';
import {
    CreateLeaveGradeDTO,
    UpdateLeaveGradeDTO,
    CreateLeavePolicyDTO,
    UpdateLeavePolicyDTO,
} from './leave-grade.types';

/**
 * List all leave grades for a company
 */
export const listLeaveGrades = async (companyId: string) => {
    const grades = await prisma.leaveGrade.findMany({
        where: { companyId },
        include: {
            policies: {
                orderBy: { leaveType: 'asc' },
            },
            _count: {
                select: {
                    employees: true,
                },
            },
        },
        orderBy: { name: 'asc' },
    });

    return grades;
};

/**
 * Get a single leave grade with its policies
 */
export const getLeaveGrade = async (gradeId: string, companyId: string) => {
    const grade = await prisma.leaveGrade.findFirst({
        where: {
            id: gradeId,
            companyId,
        },
        include: {
            policies: {
                orderBy: { leaveType: 'asc' },
            },
            _count: {
                select: {
                    employees: true,
                },
            },
        },
    });

    if (!grade) {
        throw new AppError('Leave grade not found', 404);
    }

    return grade;
};

/**
 * Create a new leave grade
 */
export const createLeaveGrade = async (companyId: string, data: CreateLeaveGradeDTO) => {
    // Check if a grade with the same name already exists
    const existing = await prisma.leaveGrade.findFirst({
        where: {
            companyId,
            name: data.name,
        },
    });

    if (existing) {
        throw new AppError('A leave grade with this name already exists', 400);
    }

    const grade = await prisma.leaveGrade.create({
        data: {
            companyId,
            name: data.name,
        },
        include: {
            policies: true,
            _count: {
                select: {
                    employees: true,
                },
            },
        },
    });

    return grade;
};

/**
 * Update a leave grade
 */
export const updateLeaveGrade = async (
    gradeId: string,
    companyId: string,
    data: UpdateLeaveGradeDTO
) => {
    // Verify grade belongs to company
    const existing = await prisma.leaveGrade.findFirst({
        where: {
            id: gradeId,
            companyId,
        },
    });

    if (!existing) {
        throw new AppError('Leave grade not found', 404);
    }

    // If updating name, check for duplicates
    if (data.name) {
        const duplicate = await prisma.leaveGrade.findFirst({
            where: {
                companyId,
                name: data.name,
                id: { not: gradeId },
            },
        });

        if (duplicate) {
            throw new AppError('A leave grade with this name already exists', 400);
        }
    }

    const grade = await prisma.leaveGrade.update({
        where: { id: gradeId },
        data: {
            name: data.name,
        },
        include: {
            policies: true,
            _count: {
                select: {
                    employees: true,
                },
            },
        },
    });

    return grade;
};

/**
 * Delete a leave grade
 */
export const deleteLeaveGrade = async (gradeId: string, companyId: string) => {
    // Verify grade belongs to company
    const grade = await prisma.leaveGrade.findFirst({
        where: {
            id: gradeId,
            companyId,
        },
        include: {
            _count: {
                select: {
                    employees: true,
                },
            },
        },
    });

    if (!grade) {
        throw new AppError('Leave grade not found', 404);
    }

    // Prevent deletion if employees are assigned
    if (grade._count.employees > 0) {
        throw new AppError(
            `Cannot delete leave grade. ${grade._count.employees} employee(s) are currently assigned to this grade.`,
            400
        );
    }

    await prisma.leaveGrade.delete({
        where: { id: gradeId },
    });

    return { message: 'Leave grade deleted successfully' };
};

/**
 * Create a leave policy for a grade
 */
export const createLeavePolicy = async (
    gradeId: string,
    companyId: string,
    data: CreateLeavePolicyDTO
) => {
    // Verify grade belongs to company
    const grade = await prisma.leaveGrade.findFirst({
        where: {
            id: gradeId,
            companyId,
        },
    });

    if (!grade) {
        throw new AppError('Leave grade not found', 404);
    }

    // Check if policy for this leave type already exists
    const existing = await prisma.leavePolicy.findFirst({
        where: {
            leaveGradeId: gradeId,
            leaveType: data.leaveType,
        },
    });

    if (existing) {
        throw new AppError(
            `A policy for ${data.leaveType} already exists in this grade. Use update instead.`,
            400
        );
    }

    const policy = await prisma.leavePolicy.create({
        data: {
            leaveGradeId: gradeId,
            leaveType: data.leaveType,
            totalDays: data.totalDays,
            carryForward: data.carryForward || false,
            maxCarryAmount: data.maxCarryAmount || 0,
        },
    });

    return policy;
};

/**
 * Update a leave policy
 */
export const updateLeavePolicy = async (
    gradeId: string,
    policyId: string,
    companyId: string,
    data: UpdateLeavePolicyDTO
) => {
    // Verify grade belongs to company
    const grade = await prisma.leaveGrade.findFirst({
        where: {
            id: gradeId,
            companyId,
        },
    });

    if (!grade) {
        throw new AppError('Leave grade not found', 404);
    }

    // Verify policy belongs to this grade
    const policy = await prisma.leavePolicy.findFirst({
        where: {
            id: policyId,
            leaveGradeId: gradeId,
        },
    });

    if (!policy) {
        throw new AppError('Leave policy not found', 404);
    }

    // Build update data
    const updateData: any = {};
    if (data.totalDays !== undefined) updateData.totalDays = data.totalDays;
    if (data.carryForward !== undefined) updateData.carryForward = data.carryForward;
    if (data.maxCarryAmount !== undefined) updateData.maxCarryAmount = data.maxCarryAmount;

    // Additional validation: if disabling carryForward, reset maxCarryAmount
    if (data.carryForward === false) {
        updateData.maxCarryAmount = 0;
    }

    const updated = await prisma.leavePolicy.update({
        where: { id: policyId },
        data: updateData,
    });

    return updated;
};

/**
 * Delete a leave policy
 */
export const deleteLeavePolicy = async (
    gradeId: string,
    policyId: string,
    companyId: string
) => {
    // Verify grade belongs to company
    const grade = await prisma.leaveGrade.findFirst({
        where: {
            id: gradeId,
            companyId,
        },
    });

    if (!grade) {
        throw new AppError('Leave grade not found', 404);
    }

    // Verify policy belongs to this grade
    const policy = await prisma.leavePolicy.findFirst({
        where: {
            id: policyId,
            leaveGradeId: gradeId,
        },
    });

    if (!policy) {
        throw new AppError('Leave policy not found', 404);
    }

    await prisma.leavePolicy.delete({
        where: { id: policyId },
    });

    return { message: 'Leave policy deleted successfully' };
};
