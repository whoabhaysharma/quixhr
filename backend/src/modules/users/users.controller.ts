import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';
import { getPaginationParams } from '@/utils/pagination';
import { UserService } from './users.service';
import { GetUsersQuery } from './users.schema';

export const getUsers = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const pagination = getPaginationParams(req, 'createdAt', 'desc');
        const filters = req.query as unknown as GetUsersQuery;

        const result = await UserService.getUsers(pagination, filters);

        sendResponse(res, 200, result, 'Users retrieved successfully');
    }
);

export const getUserById = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const { userId } = req.params;

        const user = await UserService.getUserById(userId);

        sendResponse(res, 200, user, 'User retrieved successfully');
    }
);
