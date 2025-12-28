
import { Response } from 'express';
import { AuthRequest } from '../../shared/middleware/auth.middleware';
import * as leaveService from './leave.service';
import { CreateLeaveDto } from './leave.types';
import { LeaveStatus } from '@prisma/client';

/**
 * Apply for leave
 */
export async function apply(req: AuthRequest, res: Response) {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: 'Unauthorized' });
            return;
        }

        const dto: CreateLeaveDto = req.body;
        const leave = await leaveService.applyLeave(req.user.id, dto);
        res.status(201).json({ success: true, data: leave });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message || 'Failed to apply for leave' });
    }
}

/**
 * Get my leaves
 */
export async function getMyLeaves(req: AuthRequest, res: Response) {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: 'Unauthorized' });
            return;
        }

        const leaves = await leaveService.getMyLeaves(req.user.id);
        res.json({ success: true, data: leaves });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message || 'Failed to fetch leaves' });
    }
}

/**
 * Get all company leaves (Admin)
 */
export async function getAll(req: AuthRequest, res: Response) {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: 'Unauthorized' });
            return;
        }

        const leaves = await leaveService.getAllLeavesForAdmin(req.user.id, req.query);
        res.json({ success: true, data: leaves });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message || 'Failed to fetch leaves' });
    }
}

/**
 * Update status
 */
export async function updateStatus(req: AuthRequest, res: Response) {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: 'Unauthorized' });
            return;
        }

        const { id } = req.params;
        const { status } = req.body;

        if (!Object.values(LeaveStatus).includes(status)) {
            res.status(400).json({ success: false, error: 'Invalid status' });
            return;
        }

        const leave = await leaveService.updateLeaveStatus(id, status, req.user.id);
        res.json({ success: true, data: leave });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message || 'Failed to update leave status' });
    }
}

/**
 * Cancel leave
 */
export async function cancel(req: AuthRequest, res: Response) {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: 'Unauthorized' });
            return;
        }
        const { id } = req.params;
        const result = await leaveService.cancelLeave(id, req.user.id);
        res.json({ success: true, ...result });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message || 'Failed to cancel leave' });
    }
}

/**
 * Get my leave balances
 */
export async function getMyBalances(req: AuthRequest, res: Response) {
    try {
        if (!req.user || !req.user.employeeId) {
            res.status(401).json({ success: false, error: 'Unauthorized or Profile missing' });
            return;
        }

        // We need employeeId. req.user has user.id. need to find employee id.
        // Wait, auth middleware might attach employee info?
        // req.user is User & {...}. In applyLeave service, we fetch employee from user.
        // But leaveService.getLeaveBalances takes employeeId.
        // We can use same pattern: helper in service or fetch in controller.
        // The middleware auth attaches `employee` if expanded? No, just user usually.
        // However, apply helper `getMyLeaves` takes `userId` and resolves employee.
        // `getLeaveBalances` takes `employeeId`.
        // I should update getLeaveBalances to take userId for consistency? 
        // Or resolve it here.
        // Actually `req.user.employee` works if middleware includes it.
        // Let's assume req.user might have it if `authMiddleware` fetches it.
        // Looking at `authMiddleware` usage in other files, it seems `req.user` usually is User model.
        // I'll fetch employeeId or update service to take userId.
        // I'll update Controller to call a service wrapper or fetch employee first.
        // But `leaveService` methods usually take `userId` and resolve.
        // `getLeaveBalances` I implemented takes `employeeId`.
        // I'll update Controller to rely on `leaveService.getLeaveBalancesByUserId` (I'll create it) OR just resolve here.
        // Resolving there is cleaner.
        // But I can't edit service again in this tool call.
        // I'll Resolve in Controller using `prisma`? No, controller shouldn't use prisma directly.
        // I'll assume `req.user.employeeId` exists (added in some efficient middleware)?
        // `calendar.controller.ts` used `req.user?.employeeId`. So Custom Auth Middleware DOES attach it.
        // So I can use `req.user.employeeId`.

        const employeeId = req.user.employeeId;
        if (!employeeId) throw new Error("Employee profile not found");

        const balances = await leaveService.getLeaveBalances(employeeId);
        res.json({ success: true, data: balances });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message || 'Failed to fetch balances' });
    }
}

/**
 * Assign balance (Admin)
 */
export async function assignBalance(req: AuthRequest, res: Response) {
    try {
        // Validation: Admin only
        if (req.user?.role !== 'HR_ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ success: false, error: 'Forbidden' });
        }

        const { employeeId, type, allocated, year } = req.body;
        if (!employeeId || !type || allocated === undefined || !year) {
            return res.status(400).json({ success: false, error: 'Missing fields' });
        }

        const result = await leaveService.assignLeaveBalance(employeeId, type, allocated, year);
        res.json({ success: true, data: result });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
}
