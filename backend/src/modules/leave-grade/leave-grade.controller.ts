import { Request, Response } from 'express';
import * as LeaveGradeService from './leave-grade.service';
import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';

/**
 * @desc    List all leave grades
 * @route   GET /api/v1/leave-grades
 * @access  HR Admin
 */
export const listLeaveGrades = catchAsync(async (req: Request, res: Response) => {
    const companyId = req.targetCompanyId;

    if (!companyId) {
        return res.status(400).json({ message: 'Company ID is required' });
    }

    const grades = await LeaveGradeService.listLeaveGrades(companyId);

    sendResponse(res, 200, { grades, count: grades.length }, 'Leave grades retrieved successfully');
});

/**
 * @desc    Create a new leave grade
 * @route   POST /api/v1/leave-grades
 * @access  HR Admin
 */
export const createLeaveGrade = catchAsync(async (req: Request, res: Response) => {
    const companyId = req.targetCompanyId;

    if (!companyId) {
        return res.status(400).json({ message: 'Company ID is required' });
    }

    const grade = await LeaveGradeService.createLeaveGrade(companyId, req.body);

    sendResponse(res, 201, { grade }, 'Leave grade created successfully');
});

/**
 * @desc    Get a single leave grade with policies
 * @route   GET /api/v1/leave-grades/:id
 * @access  HR Admin
 */
export const getLeaveGrade = catchAsync(async (req: Request, res: Response) => {
    const companyId = req.targetCompanyId;
    const { id } = req.params;

    if (!companyId) {
        return res.status(400).json({ message: 'Company ID is required' });
    }

    const grade = await LeaveGradeService.getLeaveGrade(id, companyId);

    sendResponse(res, 200, { grade }, 'Leave grade retrieved successfully');
});

/**
 * @desc    Update a leave grade
 * @route   PATCH /api/v1/leave-grades/:id
 * @access  HR Admin
 */
export const updateLeaveGrade = catchAsync(async (req: Request, res: Response) => {
    const companyId = req.targetCompanyId;
    const { id } = req.params;

    if (!companyId) {
        return res.status(400).json({ message: 'Company ID is required' });
    }

    const grade = await LeaveGradeService.updateLeaveGrade(id, companyId, req.body);

    sendResponse(res, 200, { grade }, 'Leave grade updated successfully');
});

/**
 * @desc    Delete a leave grade
 * @route   DELETE /api/v1/leave-grades/:id
 * @access  HR Admin
 */
export const deleteLeaveGrade = catchAsync(async (req: Request, res: Response) => {
    const companyId = req.targetCompanyId;
    const { id } = req.params;

    if (!companyId) {
        return res.status(400).json({ message: 'Company ID is required' });
    }

    const result = await LeaveGradeService.deleteLeaveGrade(id, companyId);

    sendResponse(res, 200, result, 'Leave grade deleted successfully');
});

/**
 * @desc    Create a leave policy for a grade
 * @route   POST /api/v1/leave-grades/:id/policy
 * @access  HR Admin
 */
export const createLeavePolicy = catchAsync(async (req: Request, res: Response) => {
    const companyId = req.targetCompanyId;
    const { id } = req.params;

    if (!companyId) {
        return res.status(400).json({ message: 'Company ID is required' });
    }

    const policy = await LeaveGradeService.createLeavePolicy(id, companyId, req.body);

    sendResponse(res, 201, { policy }, 'Leave policy created successfully');
});

/**
 * @desc    Update a leave policy
 * @route   PATCH /api/v1/leave-grades/:id/policy/:pid
 * @access  HR Admin
 */
export const updateLeavePolicy = catchAsync(async (req: Request, res: Response) => {
    const companyId = req.targetCompanyId;
    const { id, pid } = req.params;

    if (!companyId) {
        return res.status(400).json({ message: 'Company ID is required' });
    }

    const policy = await LeaveGradeService.updateLeavePolicy(id, pid, companyId, req.body);

    sendResponse(res, 200, { policy }, 'Leave policy updated successfully');
});

/**
 * @desc    Delete a leave policy
 * @route   DELETE /api/v1/leave-grades/:id/policy/:pid
 * @access  HR Admin
 */
export const deleteLeavePolicy = catchAsync(async (req: Request, res: Response) => {
    const companyId = req.targetCompanyId;
    const { id, pid } = req.params;

    if (!companyId) {
        return res.status(400).json({ message: 'Company ID is required' });
    }

    const result = await LeaveGradeService.deleteLeavePolicy(id, pid, companyId);

    sendResponse(res, 200, result, 'Leave policy deleted successfully');
});
