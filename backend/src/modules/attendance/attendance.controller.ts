import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';
import { AppError } from '@/utils/appError';
import { getOrganizationContext } from '@/utils/tenantContext';
import { getPaginationParams } from '@/utils/pagination';
import { AttendanceService } from './attendance.service';
import { ClockInInput, ClockOutInput, GetAttendanceQuery } from './attendance.schema';

export const clockIn = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = getOrganizationContext(req, next);
    // Employee must be linked to the user
    const employeeId = req.user?.employeeId;
    if (!employeeId) return next(new AppError('User is not linked to an employee record', 400));

    const result = await AttendanceService.clockIn(organizationId, employeeId, req.body as ClockInInput);
    sendResponse(res, 201, result, 'Clocked in successfully');
});

export const clockOut = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = getOrganizationContext(req, next);
    const employeeId = req.user?.employeeId;
    if (!employeeId) return next(new AppError('User is not linked to an employee record', 400));

    const result = await AttendanceService.clockOut(organizationId, employeeId, req.body as ClockOutInput);
    sendResponse(res, 200, result, 'Clocked out successfully');
});

export const getMyAttendance = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = getOrganizationContext(req, next);
    const employeeId = req.user?.employeeId;
    if (!employeeId) return next(new AppError('User is not linked to an employee record', 400));

    // Default to today
    const dateQuery = req.query.date as string;
    const date = dateQuery ? new Date(dateQuery) : new Date();

    const result = await AttendanceService.getDailyLogs(organizationId, employeeId, date);
    sendResponse(res, 200, result, 'Attendance retrieved successfully');
});

export const getAllAttendance = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = getOrganizationContext(req, next);
    const pagination = getPaginationParams(req, 'date', 'desc');

    // Extract Filters
    const filters = req.query as unknown as GetAttendanceQuery;

    const result = await AttendanceService.getAttendance(organizationId, pagination, filters);
    sendResponse(res, 200, result, 'Attendance records retrieved successfully');
});

export const createAttendance = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = getOrganizationContext(req, next);
    const user = (req as any).user;
    if (!user) return next(new AppError('User not authenticated', 401));

    // For managers, we need their employeeId to verify subordinate relationship
    const requesterId = user.employeeId;
    if (user.role === 'MANAGER' && !requesterId) {
        return next(new AppError('Manager account not linked to employee profile', 400));
    }

    const { manualEntrySchema } = require('./attendance.schema');
    // Note: Schema validation should ideally be done in valid middleware, but we can do it here too or assume passed.

    const result = await AttendanceService.createManualAttendance(
        organizationId,
        req.body,
        user.role,
        requesterId || user.id // Fallback to userId for admins if not linked (though admins can do anything)
    );

    sendResponse(res, 201, result, 'Attendance created successfully');
});

export const updateAttendance = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = getOrganizationContext(req, next);
    const { attendanceId } = req.params;
    const user = (req as any).user;

    if (!user) return next(new AppError('User not authenticated', 401));
    const requesterId = user.employeeId;

    if (user.role === 'MANAGER' && !requesterId) {
        return next(new AppError('Manager account not linked to employee profile', 400));
    }

    const result = await AttendanceService.updateAttendance(
        attendanceId,
        organizationId,
        req.body,
        user.role,
        requesterId || user.id
    );

    sendResponse(res, 200, result, 'Attendance updated successfully');
});
