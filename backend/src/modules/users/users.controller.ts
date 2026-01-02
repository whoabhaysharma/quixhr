import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';
import { AppError } from '@/utils/appError';
import * as UserService from './users.service';
import { Role } from '@prisma/client';

export const getUsers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // Only Super Admin should access this for now, or maybe Org Admin for their own users (future)
    // For now, let's assume Super Admin accessing global users list
    if (req.user!.role !== 'SUPER_ADMIN') {
        return next(new AppError('Permission denied', 403));
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const role = req.query.role as Role;

    const result = await UserService.findAll({
        page,
        limit,
        search,
        role
    });

    sendResponse(res, 200, result, 'Users retrieved successfully');
});
