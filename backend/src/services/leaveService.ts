import { prisma } from '../config/database';
import { calculateLeaveDays, isValidDateRange } from '../utils/dateHelper';
import { LeaveStatus } from '@prisma/client';

export class LeaveService {
  async createLeave(
    userId: number,
    startDate: Date,
    endDate: Date,
    reason?: string
  ) {
    if (!isValidDateRange(startDate, endDate)) {
      throw new Error('Invalid date range: end date must be after start date');
    }

    const totalDays = calculateLeaveDays(startDate, endDate);

    return prisma.leave.create({
      data: {
        userId,
        startDate,
        endDate,
        totalDays,
        reason,
        status: LeaveStatus.PENDING,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  async getLeaveById(id: number) {
    return prisma.leave.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });
  }

  async getLeavesByUserId(userId: number, status?: LeaveStatus) {
    const where = status ? { userId, status } : { userId };
    return prisma.leave.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getAllLeaves(organizationId: number, status?: LeaveStatus) {
    const where: any = {
      user: {
        organizationId: organizationId
      }
    };
    if (status) {
      where.status = status;
    }

    return prisma.leave.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getPendingLeaves(organizationId: number) {
    return this.getAllLeaves(organizationId, LeaveStatus.PENDING);
  }

  async getApprovedLeaves(userId?: number) {
    const where = userId
      ? { userId, status: LeaveStatus.APPROVED }
      : { status: LeaveStatus.APPROVED };

    return prisma.leave.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    });
  }

  async getRejectedLeaves(userId?: number) {
    const where = userId
      ? { userId, status: LeaveStatus.REJECTED }
      : { status: LeaveStatus.REJECTED };

    return prisma.leave.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateLeave(
    id: number,
    userId: number,
    data: Partial<{
      startDate: Date;
      endDate: Date;
      reason: string;
      adminNotes: string;
    }>
  ) {
    const leave = await this.getLeaveById(id);

    if (!leave) {
      throw new Error('Leave not found');
    }

    if (leave.userId !== userId) {
      throw new Error('You can only update your own leave requests');
    }

    const updateData: any = { ...data };

    if (data.startDate || data.endDate) {
      const startDate = data.startDate || leave.startDate;
      const endDate = data.endDate || leave.endDate;

      if (!isValidDateRange(startDate, endDate)) {
        throw new Error('Invalid date range');
      }

      updateData.totalDays = calculateLeaveDays(startDate, endDate);
    }

    return prisma.leave.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  async updateLeaveStatus(id: number, status: LeaveStatus, adminNotes?: string) {
    return prisma.leave.update({
      where: { id },
      data: {
        status,
        adminNotes,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  async approveLeave(id: number, adminNotes?: string) {
    return this.updateLeaveStatus(id, LeaveStatus.APPROVED, adminNotes);
  }

  async rejectLeave(id: number, adminNotes?: string) {
    return this.updateLeaveStatus(id, LeaveStatus.REJECTED, adminNotes);
  }

  async cancelLeave(id: number, userId: number) {
    const leave = await this.getLeaveById(id);

    if (!leave) {
      throw new Error('Leave not found');
    }

    if (leave.userId !== userId) {
      throw new Error('You can only cancel your own leave requests');
    }

    return this.updateLeaveStatus(id, LeaveStatus.CANCELLED);
  }

  async deleteLeave(id: number, userId: number) {
    const leave = await this.getLeaveById(id);

    if (!leave) {
      throw new Error('Leave not found');
    }

    if (leave.userId !== userId && leave.status !== 'PENDING') {
      throw new Error('You can only delete pending leave requests');
    }

    return prisma.leave.delete({
      where: { id },
    });
  }

  async getLeaveStats(userId: number) {
    const leaves = await this.getLeavesByUserId(userId);

    return {
      totalLeaves: leaves.length,
      pending: leaves.filter(l => l.status === LeaveStatus.PENDING).length,
      approved: leaves.filter(l => l.status === LeaveStatus.APPROVED).length,
      rejected: leaves.filter(l => l.status === LeaveStatus.REJECTED).length,
      cancelled: leaves.filter(l => l.status === LeaveStatus.CANCELLED).length,
      totalDaysTaken: leaves
        .filter(l => l.status === LeaveStatus.APPROVED)
        .reduce((sum, l) => sum + l.totalDays, 0),
    };
  }
}
