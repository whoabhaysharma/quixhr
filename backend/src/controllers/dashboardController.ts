import prisma from '../services/prisma';
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
            const [totalEmployees, pendingLeaves, onLeaveToday] = await Promise.all([
                // 1. Total Employees
                prisma.user.count({
                    where: { organizationId: String(organizationId) }
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
                })
            ]);

            res.json({
                success: true,
                data: {
                    totalEmployees,
                    pendingLeaves,
                    onLeaveToday
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

            const [approvedLeaves, pendingLeaves] = await Promise.all([
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
                })
            ]);

            // Calculate Usage
            // Mocking Total Allowance as 20 days for now.
            // TODO: Move this to Organization settings schema later.
            const TOTAL_ALLOWANCE = 20;
            const usedDays = approvedLeaves.reduce((sum: number, leave: { totalDays: number }) => sum + leave.totalDays, 0);
            const balance = Math.max(0, TOTAL_ALLOWANCE - usedDays);

            res.json({
                success: true,
                data: {
                    allowance: TOTAL_ALLOWANCE,
                    used: usedDays,
                    balance,
                    pendingRequests: pendingLeaves
                }
            });

        } catch (error) {
            next(error);
        }
    }
}

export const dashboardController = new DashboardController();
