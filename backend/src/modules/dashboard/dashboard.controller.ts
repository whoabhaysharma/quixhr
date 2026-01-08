import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';
import { AppError } from '@/utils/appError';
import { Role } from '@prisma/client';
import prisma from '@/utils/prisma';

export const getDashboardStats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user!;
    const { role } = user;

    let stats: any = {};

    switch (role) {
        case Role.SUPER_ADMIN:
            // Super Admin Stats
            const [organizationsCount, usersCount, activeSubscriptions] = await Promise.all([
                prisma.organization.count(),
                prisma.user.count(),
                prisma.subscription.count({ where: { status: 'ACTIVE' } })
            ]);
            stats = {
                organizationsCount,
                usersCount,
                activeSubscriptions
            };
            break;

        default:
            return next(new AppError('This dashboard endpoint is for Super Admin only. Please use organization or me endpoints.', 403));
    }

    sendResponse(res, 200, stats, 'Dashboard stats retrieved');
});
