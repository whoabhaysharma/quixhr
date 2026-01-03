import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';
import { AdminService } from './admin.service';

/**
 * @desc    Get platform-wide dashboard summary
 * @route   GET /api/v1/admin/dashboard
 * @access  Super Admin Only
 */
export const getPlatformDashboard = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const response = await AdminService.getPlatformDashboard();
        sendResponse(res, 200, response, 'Platform dashboard retrieved successfully');
    }
);
