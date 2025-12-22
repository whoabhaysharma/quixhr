import { Request, Response, NextFunction } from 'express';
import { leaveService } from '../services/leaveService';
import { LeaveStatus, Role } from '@prisma/client';

class LeaveController {
    async getAllLeaves(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Enforce Organization Context for non-Super Admins
            let organizationId = req.user?.organizationId;

            // If Super Admin, they might query specific org
            // @ts-ignore - Role might not be regenerated yet
            if (req.user?.role === 'SUPER_ADMIN' && req.query.organizationId) {
                organizationId = Number(req.query.organizationId);
            }

            // @ts-ignore
            if (!organizationId && req.user?.role !== 'SUPER_ADMIN') {
                res.status(400).json({ success: false, error: { message: 'Organization Context missing' } });
                return;
            }

            const leaves = await leaveService.getAllLeaves(organizationId);
            res.json({ success: true, data: { leaves } });
        } catch (error) {
            next(error);
        }
    }

    async getLeavesByUserId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = Number(req.params.userId || req.user?.id); // Default to self if not provided (though route has :userId)

            // Authorization check: Employees can only view their own leaves
            if (req.user?.role === Role.EMPLOYEE && req.user.id !== userId) {
                res.status(403).json({ success: false, error: { message: 'Forbidden: Cannot view other users leaves' } });
                return;
            }
            // Admin/HR should only view leaves of users in THEIR organization.
            // But we don't have easy check here without fetching user. 
            // For now, assuming standard role protection.

            const leaves = await leaveService.getLeavesByUserId(userId);
            res.json({ success: true, data: { leaves } });
        } catch (error) {
            next(error);
        }
    }

    async requestLeave(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
                return;
            }

            const { startDate, endDate, totalDays, reason } = req.body;
            const leave = await leaveService.requestLeave({
                userId,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                totalDays,
                reason,
            });
            res.status(201).json({ success: true, data: { leave } });
        } catch (error) {
            next(error);
        }
    }

    async updateLeaveStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(req.params.id);
            const { status, adminNotes } = req.body;

            if (!Object.values(LeaveStatus).includes(status)) {
                res.status(400).json({ success: false, error: { message: 'Invalid status' } });
                return;
            }

            const leave = await leaveService.updateLeaveStatus(id, status, adminNotes);
            res.json({ success: true, data: { leave } });
        } catch (error) {
            next(error);
        }
    }
}

export const leaveController = new LeaveController();
