import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';
import { AppError } from '@/utils/appError';
import { getPaginationParams } from '@/utils/pagination';
import { AttendanceService } from './attendance.service';
import { ClockInInput, ClockOutInput, GetAttendanceQuery } from './attendance.schema';

/**
 * Helper to get organization context
 * For personal routes (/check-in, /check-out, /me), use user's organization
 * For org-scoped routes, use req.targetOrganizationId
 */
const getOrgContext = (req: Request): string => {
    return req.targetOrganizationId || req.user?.organizationId || '';
};

export const clockIn = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = getOrgContext(req);
    if (!organizationId) return next(new AppError('Organization context required', 400));

    const employeeId = req.user?.employeeId;
    if (!employeeId) return next(new AppError('User is not linked to an employee record', 400));

    const result = await AttendanceService.clockIn(organizationId, employeeId, req.body as ClockInInput);
    sendResponse(res, 201, result, 'Clocked in successfully');
});

export const clockOut = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = getOrgContext(req);
    if (!organizationId) return next(new AppError('Organization context required', 400));

    const employeeId = req.user?.employeeId;
    if (!employeeId) return next(new AppError('User is not linked to an employee record', 400));

    const result = await AttendanceService.clockOut(organizationId, employeeId, req.body as ClockOutInput);
    sendResponse(res, 200, result, 'Clocked out successfully');
});

export const getMyAttendance = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = getOrgContext(req);
    if (!organizationId) return next(new AppError('Organization context required', 400));

    const employeeId = req.user?.employeeId;
    if (!employeeId) return next(new AppError('User is not linked to an employee record', 400));

    // Default to today
    const dateQuery = req.query.date as string;
    const date = dateQuery ? new Date(dateQuery) : new Date();

    const result = await AttendanceService.getDailyLogs(organizationId, employeeId, date);
    sendResponse(res, 200, result, 'Attendance retrieved successfully');
});

/**
 * Get all attendance for a specific organization
 * Used by org-scoped route: /api/v1/org/:organizationId/attendance
 */
export const getAllAttendance = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = req.targetOrganizationId || req.params.organizationId;
    if (!organizationId) return next(new AppError('Organization context required', 400));

    const pagination = getPaginationParams(req, 'date', 'desc');
    const filters = req.query as unknown as GetAttendanceQuery;

    const result = await AttendanceService.getAttendance(organizationId, pagination, filters);
    sendResponse(res, 200, result, 'Attendance records retrieved successfully');
});

/**
 * Get all attendance across all organizations (Super Admin only)
 * Used by flat route: /api/v1/attendance
 */
export const getAllAttendanceSuperAdmin = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // Super admin can query across organizations
    // We'll use a modified service call or create a new one
    const pagination = getPaginationParams(req, 'date', 'desc');
    const filters = req.query as unknown as GetAttendanceQuery;

    // For super admin, we don't filter by organizationId
    // We need to modify the service or create a new method
    // For now, let's use empty string to indicate "all orgs"
    const result = await AttendanceService.getAttendanceAllOrgs(pagination, filters);
    sendResponse(res, 200, result, 'Attendance records retrieved successfully');
});

export const createAttendance = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = req.targetOrganizationId || req.params.organizationId;
    if (!organizationId) return next(new AppError('Organization context required', 400));

    const user = req.user;
    if (!user) return next(new AppError('User not authenticated', 401));

    // For managers, we need their employeeId to verify subordinate relationship
    const requesterId = user.employeeId;
    if (user.role === 'MANAGER' && !requesterId) {
        return next(new AppError('Manager account not linked to employee profile', 400));
    }

    const result = await AttendanceService.createManualAttendance(
        organizationId,
        req.body,
        user.role,
        requesterId || user.userId
    );

    sendResponse(res, 201, result, 'Attendance created successfully');
});

export const updateAttendance = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { attendanceId } = req.params;
    const user = req.user;

    if (!user) return next(new AppError('User not authenticated', 401));

    // For org-scoped routes, use targetOrganizationId or params
    // For flat routes, derive from the attendance record itself
    let organizationId = req.targetOrganizationId || req.params.organizationId;

    // If no org context (flat route), we'll let the service validate
    // by fetching the attendance record first
    if (!organizationId && user.role === 'SUPER_ADMIN') {
        // Super admin can update any record, service will fetch org from record
        organizationId = ''; // Will be validated in service
    } else if (!organizationId) {
        // Non-super-admin must have org context
        organizationId = user.organizationId || '';
    }

    if (!organizationId && user.role !== 'SUPER_ADMIN') {
        return next(new AppError('Organization context required', 400));
    }

    const requesterId = user.employeeId;
    if (user.role === 'MANAGER' && !requesterId) {
        return next(new AppError('Manager account not linked to employee profile', 400));
    }

    const result = await AttendanceService.updateAttendance(
        attendanceId,
        organizationId,
        req.body,
        user.role,
        requesterId || user.userId
    );

    sendResponse(res, 200, result, 'Attendance updated successfully');
});
