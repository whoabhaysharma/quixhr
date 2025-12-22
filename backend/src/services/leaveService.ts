import prisma from './prisma';
import { Leave, LeaveStatus } from '@prisma/client';

export const leaveService = {
    async getAllLeaves(organizationId?: number): Promise<Leave[]> {
        if (organizationId) {
            return prisma.leave.findMany({
                where: {
                    user: {
                        organizationId,
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

    async getLeavesByUserId(userId: number): Promise<Leave[]> {
        return prisma.leave.findMany({
            where: { userId },
            include: {
                user: true,
            },
        });
    },

    async requestLeave(data: {
        userId: number;
        startDate: Date;
        endDate: Date;
        totalDays: number;
        reason?: string;
    }): Promise<Leave> {
        return prisma.leave.create({
            data: {
                ...data,
                status: LeaveStatus.PENDING,
            },
        });
    },

    async updateLeaveStatus(id: number, status: LeaveStatus, adminNotes?: string): Promise<Leave> {
        return prisma.leave.update({
            where: { id },
            data: {
                status,
                adminNotes,
            },
        });
    },
};
