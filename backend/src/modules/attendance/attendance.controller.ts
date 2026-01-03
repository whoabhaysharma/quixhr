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
