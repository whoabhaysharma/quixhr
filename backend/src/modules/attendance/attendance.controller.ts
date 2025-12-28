import { Response } from 'express';
import { AuthRequest } from '../../shared/middleware/auth.middleware';
import * as attendanceService from './attendance.service';
import { checkInSchema, checkOutSchema } from './attendance.types';
import * as memberService from '../member/member.service';
import { logAction } from '../audit/audit.service';
import { redis } from '../../infra/redis/redis.connection';

/**
 * Check In
 */
export async function checkIn(req: AuthRequest, res: Response): Promise<void> {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, error: 'Unauthorized' });
            return;
        }

        // Prevent double hits: Check for lock
        const lockKey = `attendance_lock:${userId}`;
        const isLocked = await redis.get(lockKey);

        if (isLocked) {
            res.status(429).json({ success: false, error: 'Request in progress, please wait' });
            return;
        }

        // Set lock for 5 seconds
        await redis.set(lockKey, '1', 'EX', 5);

        const employee = await memberService.getMemberByUserId(userId);
        if (!employee) {
            res.status(404).json({ success: false, error: 'Employee profile not found' });
            return;
        }

        const dto = checkInSchema.parse(req.body);
        const result = await attendanceService.checkIn(employee.id, dto);

        // Audit Log
        if (userId) {
            await logAction({
                userId: userId,
                action: 'ATTENDANCE_CHECKIN',
                resource: 'Attendance',
                resourceId: result.id,
                ipAddress: req.ip || req.socket.remoteAddress || 'Unknown',
                userAgent: req.headers['user-agent'],
                details: { checkInTime: result.firstCheckIn, type: result.status }
            });
        }

        res.status(201).json({ success: true, data: result });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message || 'Check-in failed' });
    }
}

/**
 * Check Out
 */
export async function checkOut(req: AuthRequest, res: Response): Promise<void> {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, error: 'Unauthorized' });
            return;
        }

        const employee = await memberService.getMemberByUserId(userId);
        if (!employee) {
            res.status(404).json({ success: false, error: 'Employee profile not found' });
            return;
        }

        const dto = checkOutSchema.parse(req.body);
        const result = await attendanceService.checkOut(employee.id, dto);

        // Audit Log
        if (userId) {
            await logAction({
                userId: userId,
                action: 'ATTENDANCE_CHECKOUT',
                resource: 'Attendance',
                resourceId: result.id,
                ipAddress: req.ip || req.socket.remoteAddress || 'Unknown',
                userAgent: req.headers['user-agent'],
                details: { checkOutTime: result.lastCheckOut }
            });
        }

        res.json({ success: true, data: result });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message || 'Check-out failed' });
    }
}

/**
 * Get My Attendance
 */
export async function getMyAppAttendance(req: AuthRequest, res: Response): Promise<void> {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, error: 'Unauthorized' });
            return;
        }

        const employee = await memberService.getMemberByUserId(userId);
        if (!employee) {
            res.status(404).json({ success: false, error: 'Employee profile not found' });
            return;
        }

        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate as string) : undefined;
        const end = endDate ? new Date(endDate as string) : undefined;

        const data = await attendanceService.getEmployeeAttendance(employee.id, start, end);
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: 'Failed to fetch attendance' });
    }
}

/**
 * Get Today's Status
 */
export async function getToday(req: AuthRequest, res: Response): Promise<void> {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, error: 'Unauthorized' });
            return;
        }

        const employee = await memberService.getMemberByUserId(userId);
        if (!employee) {
            res.status(404).json({ success: false, error: 'Employee profile not found' });
            return;
        }

        const data = await attendanceService.getTodayStatus(employee.id);
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: 'Failed to fetch today status' });
    }
}
