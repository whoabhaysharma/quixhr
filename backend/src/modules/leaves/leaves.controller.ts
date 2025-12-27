import { Request, Response, NextFunction } from 'express';
import { leaveService } from './leaves.service';
import { Role } from '@prisma/client';
import { validateCreateLeaveDto } from './dtos/create-leave.dto';
import { validateUpdateLeaveStatusDto } from './dtos/update-leave-status.dto';

class LeaveController {
    /**
     * GET /leaves
     * Get all leaves for the organization (Admin/HR only)
     */
    async getAllLeaves(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Enforce Organization Context for non-Super Admins
            let organizationId = req.user?.organizationId;

            // If Super Admin, they might query specific org
            // @ts-ignore - Role might not be regenerated yet
            if (req.user?.role === 'SUPER_ADMIN' && req.query.organizationId) {
                organizationId = req.query.organizationId as string;
            }

            // @ts-ignore
            if (!organizationId && req.user?.role !== 'SUPER_ADMIN') {
                res.status(400).json({
                    success: false,
                    error: { message: 'Organization context missing' }
                });
                return;
            }

            const leaves = await leaveService.getAllLeaves(organizationId);

            res.json({
                success: true,
                data: { leaves },
                meta: { total: leaves.length }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /leaves/user/:userId
     * Get leaves for a specific user
     */
    async getLeavesByUserId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.params.userId || req.user?.id;

            if (!userId) {
                res.status(400).json({
                    success: false,
                    error: { message: 'User ID required' }
                });
                return;
            }

            // Authorization check: Employees can only view their own leaves
            if (req.user?.role === Role.EMPLOYEE && req.user.id !== userId) {
                res.status(403).json({
                    success: false,
                    error: { message: 'Forbidden: Cannot view other users\' leaves' }
                });
                return;
            }

            const leaves = await leaveService.getLeavesByUserId(userId);

            res.json({
                success: true,
                data: { leaves },
                meta: { total: leaves.length }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /leaves
     * Create a new leave request
     */
    async requestLeave(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: { message: 'Unauthorized' }
                });
                return;
            }

            // Validate input
            const validation = validateCreateLeaveDto(req.body);
            if (!validation.valid) {
                res.status(400).json({
                    success: false,
                    error: {
                        message: 'Validation failed',
                        details: validation.errors
                    }
                });
                return;
            }

            const { type, startDate, endDate, reason, customDates } = req.body;

            // Service layer handles type mapping and date calculation
            const leave = await leaveService.requestLeave({
                userId,
                type,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                reason,
                customDates,
            });

            res.status(201).json({
                success: true,
                data: { leave }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH /leaves/:id/status
     * Update leave status (approve/reject)
     */
    async updateLeaveStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = req.params.id;

            // Validate input
            const validation = validateUpdateLeaveStatusDto(req.body);
            if (!validation.valid) {
                res.status(400).json({
                    success: false,
                    error: {
                        message: 'Validation failed',
                        details: validation.errors
                    }
                });
                return;
            }

            const { status, adminNotes } = req.body;

            const leave = await leaveService.updateLeaveStatus(id, status, adminNotes);

            res.json({
                success: true,
                data: { leave }
            });
        } catch (error) {
            next(error);
        }
    }
}

export const leaveController = new LeaveController();
