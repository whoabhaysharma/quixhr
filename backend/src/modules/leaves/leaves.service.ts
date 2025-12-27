import prisma from '../../shared/services/prisma';
import { LeaveStatus, LeaveType } from '@prisma/client';
import { toLeaveResponseDto, LeaveResponseDto } from './dtos/leave-response.dto';

/**
 * Prisma select object for safe user fields
 * Excludes password and other sensitive data
 */
const safeUserSelect = {
    id: true,
    name: true,
    email: true,
    avatar: true,
    role: true,
};

/**
 * Prisma select object for complete leave data with safe user fields
 */
const leaveWithUserSelect = {
    id: true,
    userId: true,
    type: true,
    startDate: true,
    endDate: true,
    totalDays: true,
    reason: true,
    status: true,
    adminNotes: true,
    createdAt: true,
    updatedAt: true,
    user: {
        select: safeUserSelect,
    },
};

/**
 * Map frontend leave type to backend LeaveType enum
 */
function mapLeaveType(type: string): LeaveType {
    const typeMap: Record<string, LeaveType> = {
        'Vacation': LeaveType.ANNUAL,
        'Sick': LeaveType.SICK,
        'Personal': LeaveType.CASUAL,
    };
    return typeMap[type] || LeaveType.ANNUAL;
}

/**
 * Calculate total days for leave request
 */
function calculateTotalDays(
    startDate: Date,
    endDate: Date,
    customDates?: string[]
): number {
    // If customDates array is provided, use its length
    if (customDates && Array.isArray(customDates) && customDates.length > 0) {
        return customDates.length;
    }

    // Otherwise calculate from date range
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
}

export const leaveService = {
    /**
     * Get all leaves for an organization
     * Returns sanitized data without sensitive user fields
     */
    async getAllLeaves(organizationId?: string | number): Promise<LeaveResponseDto[]> {
        let leaves;

        if (organizationId) {
            leaves = await prisma.leave.findMany({
                where: {
                    user: {
                        organizationId: String(organizationId),
                    },
                },
                select: leaveWithUserSelect,
                orderBy: {
                    createdAt: 'desc',
                },
            });
        } else {
            leaves = await prisma.leave.findMany({
                select: leaveWithUserSelect,
                orderBy: {
                    createdAt: 'desc',
                },
            });
        }

        return leaves.map(toLeaveResponseDto);
    },

    /**
     * Get leaves for a specific user
     * Returns sanitized data without sensitive user fields
     */
    async getLeavesByUserId(userId: string | number): Promise<LeaveResponseDto[]> {
        const leaves = await prisma.leave.findMany({
            where: { userId: String(userId) },
            select: leaveWithUserSelect,
            orderBy: {
                createdAt: 'desc',
            },
        });

        return leaves.map(toLeaveResponseDto);
    },

    /**
     * Create a new leave request
     * Handles type mapping and total days calculation
     */
    async requestLeave(data: {
        userId: string | number;
        type: string;
        startDate: Date;
        endDate: Date;
        reason?: string;
        customDates?: string[];
    }): Promise<LeaveResponseDto> {
        const { userId, type, startDate, endDate, reason, customDates } = data;

        // Map frontend type to backend enum
        const leaveType = mapLeaveType(type);

        // Calculate total days
        const totalDays = calculateTotalDays(startDate, endDate, customDates);

        const leave = await prisma.leave.create({
            data: {
                userId: String(userId),
                type: leaveType,
                startDate,
                endDate,
                totalDays,
                reason,
                status: LeaveStatus.PENDING,
            },
            select: leaveWithUserSelect,
        });

        return toLeaveResponseDto(leave);
    },

    /**
     * Update leave status (approve/reject)
     * Returns sanitized data without sensitive user fields
     */
    async updateLeaveStatus(
        id: string,
        status: LeaveStatus,
        adminNotes?: string
    ): Promise<LeaveResponseDto> {
        const leave = await prisma.leave.update({
            where: { id },
            data: {
                status,
                adminNotes,
            },
            select: leaveWithUserSelect,
        });

        return toLeaveResponseDto(leave);
    },
};
