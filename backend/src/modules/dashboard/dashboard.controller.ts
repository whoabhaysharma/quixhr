import prisma from '../../shared/services/prisma';
import { Request, Response, NextFunction } from 'express';
import { LeaveStatus, Role } from '@prisma/client';

class DashboardController {

    // GET /api/v1/dashboard/admin-stats
    async getAdminStats(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId) {
                res.status(400).json({ success: false, error: { message: "Organization not found" } });
                return;
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const endOfToday = new Date();
            endOfToday.setHours(23, 59, 59, 999);

            // Parallel DB queries for efficiency
            const [
                totalEmployees,
                pendingLeaves,
                onLeaveToday,
                presentToday,
                absentToday,
                upcomingHolidays,
                recentJoiners,
                leaveDistribution
            ] = await Promise.all([
                // 1. Total Employees
                prisma.user.count({
                    where: {
                        organizationId: String(organizationId),
                        role: Role.EMPLOYEE
                    }
                }),

                // 2. Pending Approvals
                prisma.leave.count({
                    where: {
                        user: { organizationId: String(organizationId) },
                        status: LeaveStatus.PENDING
                    }
                }),

                // 3. Active Today (People on APPROVED leave that overlaps with today)
                prisma.leave.count({
                    where: {
                        user: { organizationId: String(organizationId) },
                        status: LeaveStatus.APPROVED,
                        AND: [
                            { startDate: { lte: endOfToday } },
                            { endDate: { gte: today } }
                        ]
                    }
                }),

                // 4. Present Today
                prisma.attendance.count({
                    where: {
                        user: { organizationId: String(organizationId) },
                        date: today,
                        status: { in: ['PRESENT', 'HALF_DAY'] }
                    }
                }),

                // 5. Absent Today
                prisma.attendance.count({
                    where: {
                        user: { organizationId: String(organizationId) },
                        date: today,
                        status: 'ABSENT'
                    }
                }),

                // 6. Upcoming Holidays
                prisma.holiday.findMany({
                    where: {
                        calendar: { organizationId: String(organizationId) },
                        date: { gte: today }
                    },
                    orderBy: { date: 'asc' },
                    take: 3
                }),

                // 7. Recent Joiners
                prisma.user.findMany({
                    where: {
                        organizationId: String(organizationId),
                        role: Role.EMPLOYEE
                    },
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 5,
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                        role: true,
                        createdAt: true
                    }
                }),

                // 8. Leave Distribution (by Type, for all time or this year?)
                // Let's do Current Year Distribution
                prisma.leave.groupBy({
                    by: ['type'],
                    where: {
                        user: { organizationId: String(organizationId) },
                        status: LeaveStatus.APPROVED,
                    },
                    _count: {
                        id: true
                    }
                })
            ]);

            res.json({
                success: true,
                data: {
                    totalEmployees,
                    pendingLeaves,
                    onLeaveToday,
                    presentToday,
                    absentToday,
                    upcomingHolidays,
                    recentJoiners,
                    leaveDistribution
                }
            });

        } catch (error) {
            next(error);
        }
    }

    // GET /api/v1/dashboard/employee-stats
    async getEmployeeStats(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.id;
            const organizationId = req.user?.organizationId;

            if (!userId || !organizationId) {
                res.status(401).json({ success: false, error: { message: "Unauthorized" } });
                return;
            }

            const userIdStr = String(userId);
            const organizationIdStr = String(organizationId);

            const currentYear = new Date().getFullYear();
            const startOfYear = new Date(currentYear, 0, 1);
            const endOfYear = new Date(currentYear + 1, 0, 0);

            const currentMonth = new Date().getMonth();
            const startOfMonth = new Date(currentYear, currentMonth, 1);
            const endOfMonth = new Date(currentYear, currentMonth + 1, 0);

            const [approvedLeaves, pendingLeaves, attendanceStats, leaveDistribution] = await Promise.all([
                // 1. Get all approved leaves for this year to calculate usage
                prisma.leave.findMany({
                    where: {
                        userId: userIdStr,
                        status: LeaveStatus.APPROVED,
                        startDate: { gte: startOfYear },
                        endDate: { lte: endOfYear }
                    },
                    select: { totalDays: true }
                }),

                // 2. Count pending requests
                prisma.leave.count({
                    where: {
                        userId: userIdStr,
                        status: LeaveStatus.PENDING
                    }
                }),

                // 3. Attendance Stats (Current Month)
                prisma.attendance.groupBy({
                    by: ['status'],
                    where: {
                        userId: userIdStr,
                        date: { gte: startOfMonth, lte: endOfMonth }
                    },
                    _count: { id: true }
                }),

                // 4. Leave Distribution by Type (Yearly)
                prisma.leave.groupBy({
                    by: ['type'],
                    where: {
                        userId: userIdStr,
                        status: LeaveStatus.APPROVED,
                        startDate: { gte: startOfYear },
                        endDate: { lte: endOfYear }
                    },
                    _count: { id: true },
                    _sum: { totalDays: true }
                })
            ]);

            // Calculate Usage
            // Mocking Total Allowance as 20 days for now.
            // TODO: Move this to Organization settings schema later.
            const TOTAL_ALLOWANCE = 20;
            const usedDays = approvedLeaves.reduce((sum: number, leave: { totalDays: number }) => sum + leave.totalDays, 0);
            const balance = Math.max(0, TOTAL_ALLOWANCE - usedDays);

            // Process Attendance
            const attendance = {
                present: attendanceStats.find(a => a.status === 'PRESENT')?._count.id || 0,
                absent: attendanceStats.find(a => a.status === 'ABSENT')?._count.id || 0,
                halfDay: attendanceStats.find(a => a.status === 'HALF_DAY')?._count.id || 0,
                late: 0 // Placeholder if we tracking late clock-ins
            };

            res.json({
                success: true,
                data: {
                    allowance: TOTAL_ALLOWANCE,
                    used: usedDays,
                    balance,
                    pendingRequests: pendingLeaves,
                    attendance,
                    leaveDistribution
                }
            });

        } catch (error) {
            next(error);
        }
    }
}

export const dashboardController = new DashboardController();
