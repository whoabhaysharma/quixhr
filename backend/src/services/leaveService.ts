import prisma from './prisma';
import { Leave, LeaveStatus } from '@prisma/client';

export const leaveService = {
    async getAllLeaves(organizationId?: string | number): Promise<Leave[]> {
        if (organizationId) {
            return prisma.leave.findMany({
                where: {
                    user: {
                        organizationId: String(organizationId),
                    },
                },
                include: {
                    user: true,
                },
            });
        }
        return prisma.leave.findMany({
            include: {
                user: true,
            },
        });
    },

    async getLeavesByUserId(userId: string | number): Promise<Leave[]> {
        return prisma.leave.findMany({
            where: { userId: String(userId) },
            include: {
                user: true,
            },
        });
    },

    async requestLeave(data: {
        userId: string | number;
        startDate: Date;
        endDate: Date;
        totalDays: number;
        reason?: string;
    }): Promise<Leave> {
        const { userId, ...rest } = data;
        return prisma.leave.create({
            data: {
                ...rest,
                userId: String(userId),
                status: LeaveStatus.PENDING,
            },
        });
    },

    async updateLeaveStatus(id: string, status: LeaveStatus, adminNotes?: string): Promise<Leave> {
        return prisma.leave.update({
            where: { id },
            data: {
                status,
                adminNotes,
            },
        });
    },
};
