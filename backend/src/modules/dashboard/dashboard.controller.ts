import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';
import { AppError } from '@/utils/appError';
import { Role } from '@prisma/client';
import * as CompanyService from '../companies/company.service';
import { MeService } from '../me/me.service';
import prisma from '@/utils/prisma';

export const getDashboardStats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user!;
    const { role, companyId } = user;

    let stats: any = {};

    switch (role) {
        case Role.SUPER_ADMIN:
            // Super Admin Stats
            const [companiesCount, usersCount, activeSubscriptions] = await Promise.all([
                prisma.company.count(),
                prisma.user.count(),
                prisma.subscription.count({ where: { status: 'ACTIVE' } })
            ]);
            stats = {
                companiesCount,
                usersCount,
                activeSubscriptions
            };
            break;

        case Role.ORG_ADMIN:
        case Role.HR_ADMIN:
            // Company Admin Stats
            if (!companyId) {
                return next(new AppError('No company associated with admin user', 400));
            }
            stats = await CompanyService.getDashboardStats(companyId);
            break;

        case Role.EMPLOYEE:
            // Employee Stats - Reuse MeService logic or aggregate here
            // We can return attendance summary, leave balance, pending requests etc.
            if (!user.userId) return next(new AppError('User ID missing', 400));

            const [attendance, leaveBalance] = await Promise.all([
                MeService.getMyAttendance(user.userId, 1, 5),
                MeService.getMyLeaveBalance(user.userId)
            ]);

            stats = {
                attendanceSummary: attendance,
                leaveBalance: leaveBalance
            };
            break;

        default:
            return next(new AppError('Invalid role', 403));
    }

    sendResponse(res, 200, stats, 'Dashboard stats retrieved');
});
