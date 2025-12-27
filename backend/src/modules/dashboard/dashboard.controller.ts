import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../../shared/middleware/auth.middleware';
import * as dashboardService from './dashboard.service';

const router = Router();

/**
 * GET /admin/stats
 * Get admin dashboard statistics
 */
router.get('/admin/stats', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user!;

        // Check if user has admin/HR role
        if (!['HR_ADMIN', 'MANAGER', 'SUPER_ADMIN'].includes(user.role)) {
            res.status(403).json({
                success: false,
                error: 'Insufficient permissions',
            });
            return;
        }

        if (!user.companyId) {
            res.status(400).json({
                success: false,
                error: 'Company ID not found',
            });
            return;
        }

        const stats = await dashboardService.getAdminStats(user.companyId);

        res.json({
            success: true,
            data: stats,
        });
    } catch (error: any) {
        console.error('Get admin stats error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch admin statistics',
        });
    }
});

/**
 * GET /employee/stats
 * Get employee dashboard statistics
 */
router.get('/employee/stats', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user!;

        if (!user.employeeId) {
            res.status(400).json({
                success: false,
                error: 'Employee ID not found',
            });
            return;
        }

        const stats = await dashboardService.getEmployeeStats(user.employeeId);

        res.json({
            success: true,
            data: stats,
        });
    } catch (error: any) {
        console.error('Get employee stats error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch employee statistics',
        });
    }
});

export default router;
