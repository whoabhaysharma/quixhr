import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';
import { AppError } from '@/utils/appError';
import * as AttendanceService from './attendance.service';

export const clockIn = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // Only employees can clock in for themselves
    // If we support Admin clocking in for others, we need logic.
    // For "check-in" route, it's usually "me".
    const employeeId = req.user!.employeeId;

    if (!employeeId) {
        return next(new AppError('User is not linked to an employee record', 400));
    }

    const { gpsCoords, method } = req.body;

    const record = await AttendanceService.clockIn(employeeId, gpsCoords, method);
    sendResponse(res, 201, record, 'Clocked in successfully');
});

export const clockOut = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const employeeId = req.user!.employeeId;

    if (!employeeId) {
        return next(new AppError('User is not linked to an employee record', 400));
    }

    const { gpsCoords, method } = req.body;

    const record = await AttendanceService.clockOut(employeeId, gpsCoords, method);
    sendResponse(res, 200, record, 'Clocked out successfully');
});

export const getMyAttendance = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const employeeId = req.user!.employeeId;
    if (!employeeId) {
        return next(new AppError('User is not linked to an employee record', 400));
    }

    const today = new Date();
    const result = await AttendanceService.getDailyLogs(employeeId, today);
    sendResponse(res, 200, result, 'Attendance retrieved successfully');
});

export const getAttendanceLogs = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const employeeId = req.user!.employeeId;
    // Check Date query
    const dateQuery = req.query.date as string;

    if (!employeeId) {
        // If Admin, maybe query param employeeId? 
        // For now, let's treat this as "My Logs" or "Specific Logs"
    }

    // Fallback logic
    const targetEmployeeId = employeeId; // Only allow self specific for now in this route.
    if (!targetEmployeeId) return next(new AppError('Employee context missing', 400));

    const date = dateQuery ? new Date(dateQuery) : new Date();

    const result = await AttendanceService.getDailyLogs(targetEmployeeId, date);
    sendResponse(res, 200, result, 'Attendance logs retrieved successfully');
});
