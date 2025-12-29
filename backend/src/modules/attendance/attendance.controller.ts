import { Request, Response } from 'express';
import * as AttendanceService from './attendance.service';
import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';

/**
 * @desc    Clock In / Clock Out
 * @route   POST /api/v1/attendance/punch
 * @access  Employee
 */
export const punch = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId as string;

    const attendance = await AttendanceService.punch(userId, req.body);

    const message = req.body.type === 'IN' ? 'Clocked in successfully' : 'Clocked out successfully';
    sendResponse(res, 200, { attendance }, message);
});

/**
 * @desc    Get monthly attendance summary
 * @route   GET /api/v1/attendance/my-summary
 * @access  Employee
 */
export const getMySummary = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId as string;
    const month = req.query.month ? parseInt(req.query.month as string) : undefined;
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;

    const summary = await AttendanceService.getMySummary(userId, month, year);

    sendResponse(res, 200, { summary }, 'Summary retrieved successfully');
});

/**
 * @desc    Get daily attendance report
 * @route   GET /api/v1/attendance/report
 * @access  HR/Manager
 */
export const getDailyReport = catchAsync(async (req: Request, res: Response) => {
    const companyId = req.targetCompanyId;
    const filters = req.query;

    const report = await AttendanceService.getDailyReport(companyId, filters);

    sendResponse(res, 200, report, 'Daily report retrieved successfully');
});

/**
 * @desc    Get raw punch logs for attendance record
 * @route   GET /api/v1/attendance/logs/:id
 * @access  Admin
 */
export const getAttendanceLogs = catchAsync(async (req: Request, res: Response) => {
    const companyId = req.targetCompanyId;
    const { id } = req.params;

    const attendance = await AttendanceService.getAttendanceLogs(id, companyId);

    sendResponse(res, 200, { attendance }, 'Attendance logs retrieved successfully');
});

/**
 * @desc    Regularize attendance (Fix attendance)
 * @route   PATCH /api/v1/attendance/regularize
 * @access  Manager
 */
export const regularizeAttendance = catchAsync(async (req: Request, res: Response) => {
    const companyId = req.targetCompanyId;

    if (!companyId) {
        return res.status(400).json({ message: 'Company ID is required' });
    }

    const attendance = await AttendanceService.regularizeAttendance(companyId, req.body);

    sendResponse(res, 200, { attendance }, 'Attendance regularized successfully');
});

/**
 * @desc    Bulk sync from biometric system
 * @route   POST /api/v1/attendance/bulk-sync
 * @access  System (API Key or special auth)
 */
export const bulkSync = catchAsync(async (req: Request, res: Response) => {
    const results = await AttendanceService.bulkSync(req.body);

    sendResponse(
        res,
        200,
        results,
        `Bulk sync completed. Success: ${results.success.length}, Failed: ${results.failed.length}`
    );
});
