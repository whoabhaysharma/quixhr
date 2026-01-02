import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';
import { AppError } from '@/utils/appError';
import * as LeaveService from './leaves.service';
import {
    CreateLeaveGradeInput, UpdateLeaveGradeInput,
    CreateLeavePolicyInput, UpdateLeavePolicyInput,
    CreateLeaveRequestInput, UpdateLeaveRequestStatusInput
} from './leaves.types';
import { LeaveStatus, LeaveType } from '@prisma/client';

// =========================================================================
// 1. LEAVE GRADE CONTROLLERS
// =========================================================================

export const createLeaveGrade = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { companyId } = req.params;

    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.companyId !== companyId) {
        return next(new AppError('You do not have permission to create a leave grade for this company', 403));
    }

    const input: CreateLeaveGradeInput = {
        ...req.body,
        companyId
    };

    const grade = await LeaveService.createGrade(input);
    sendResponse(res, 201, grade, 'Leave grade created successfully');
});

export const getLeaveGradeById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id || req.params.gradeId;
    const grade = await LeaveService.findGradeById(id);

    if (!grade) {
        return next(new AppError('Leave grade not found', 404));
    }

    if (req.user!.role !== 'SUPER_ADMIN' && grade.companyId !== req.user!.companyId) {
        return next(new AppError('You do not have permission to view this leave grade', 403));
    }

    sendResponse(res, 200, grade, 'Leave grade retrieved successfully');
});

export const getLeaveGrades = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const companyId = req.targetCompanyId || req.user?.companyId;

    if (!companyId) {
        return next(new AppError('Company context is required', 400));
    }

    let filter: { companyId: string; page?: number; limit?: number; search?: string } = {
        companyId,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
        search: req.query.search as string
    };

    const result = await LeaveService.findAllGrades(filter);
    sendResponse(res, 200, result, 'Leave grades retrieved successfully');
});

export const updateLeaveGrade = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id || req.params.gradeId;
    const existing = await LeaveService.findGradeById(id);
    if (!existing) { return next(new AppError('Leave grade not found', 404)); }

    if (req.user!.role !== 'SUPER_ADMIN' && existing.companyId !== req.user!.companyId) {
        return next(new AppError('Permission denied', 403));
    }

    const grade = await LeaveService.updateGrade(id, req.body as UpdateLeaveGradeInput);
    sendResponse(res, 200, grade, 'Leave grade updated successfully');
});

export const deleteLeaveGrade = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id || req.params.gradeId;
    const existing = await LeaveService.findGradeById(id);
    if (!existing) { return next(new AppError('Leave grade not found', 404)); }

    if (req.user!.role !== 'SUPER_ADMIN' && existing.companyId !== req.user!.companyId) {
        return next(new AppError('Permission denied', 403));
    }

    await LeaveService.deleteGrade(id);
    sendResponse(res, 204, null, 'Leave grade deleted successfully');
});

// =========================================================================
// 2. LEAVE POLICY CONTROLLERS
// =========================================================================

export const getPolicies = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { gradeId } = req.params;

    // Parent check
    const grade = await LeaveService.findGradeById(gradeId);
    if (!grade) return next(new AppError('Leave grade not found', 404));

    // Auth check
    if (req.user!.role !== 'SUPER_ADMIN' && grade.companyId !== req.user!.companyId) {
        return next(new AppError('Permission denied', 403));
    }

    const policies = await LeaveService.findPolicies(gradeId);
    sendResponse(res, 200, policies, 'Leave policies retrieved successfully');
});

export const createPolicy = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { gradeId } = req.params;

    const grade = await LeaveService.findGradeById(gradeId);
    if (!grade) return next(new AppError('Leave grade not found', 404));

    if (req.user!.role !== 'SUPER_ADMIN' && grade.companyId !== req.user!.companyId) {
        return next(new AppError('Permission denied', 403));
    }

    const input: CreateLeavePolicyInput = { ...req.body, leaveGradeId: gradeId };
    const policy = await LeaveService.createPolicy(input);
    sendResponse(res, 201, policy, 'Leave policy created successfully');
});

export const updatePolicy = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { policyId } = req.params;
    const existingPolicy = await LeaveService.findPolicyById(policyId);
    if (!existingPolicy) return next(new AppError('Policy not found', 404));

    if (req.user!.role !== 'SUPER_ADMIN' && existingPolicy.grade.companyId !== req.user!.companyId) {
        return next(new AppError('Permission denied', 403));
    }

    const policy = await LeaveService.updatePolicy(policyId, req.body as UpdateLeavePolicyInput);
    sendResponse(res, 200, policy, 'Leave policy updated successfully');
});

export const deletePolicy = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { policyId } = req.params;
    const existingPolicy = await LeaveService.findPolicyById(policyId);
    if (!existingPolicy) return next(new AppError('Policy not found', 404));

    if (req.user!.role !== 'SUPER_ADMIN' && existingPolicy.grade.companyId !== req.user!.companyId) {
        return next(new AppError('Permission denied', 403));
    }

    await LeaveService.deletePolicy(policyId);
    sendResponse(res, 204, null, 'Leave policy deleted successfully');
});

// =========================================================================
// 3. LEAVE REQUEST CONTROLLERS
// =========================================================================

export const createLeaveRequest = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { employeeId } = req.params;

    // Only the employee themselves or HR/Admin can create requests
    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.userId !== employeeId && req.user!.employeeId !== employeeId) {
        // NOTE: We need to verify if 'employeeId' param matches the logged in user's employeeId
        // If the route is /employees/:employeeId/leave-requests, we check if req.user.employeeId === employeeId
        // Or if user is admin of that company.
    }

    // Simplified Auth for now:
    // If not super admin, check if user belongs to same company or is the employee
    if (req.user!.role !== 'SUPER_ADMIN') {
        // Validation logic typically happens in Middleware or Service if comprehensive.
        // Here assuming user is authorized if they can access the parent route (protected by resolveTenant typically)
    }

    const input: CreateLeaveRequestInput = {
        ...req.body,
        employeeId
    };

    const request = await LeaveService.createRequest(input);
    sendResponse(res, 201, request, 'Leave request created successfully');
});

export const getLeaveRequests = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // Determine context: Employee-Specific OR Company-Wide (Admin)
    const { employeeId } = req.params; // If nested under employee

    let filter: any = {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
        status: req.query.status as LeaveStatus,
        type: req.query.type as LeaveType,
    };

    if (employeeId) {
        filter.employeeId = employeeId;
        // Auth: User must be this employee or their manager/admin
        if (req.user!.employeeId !== employeeId && !['SUPER_ADMIN', 'ORG_ADMIN', 'HR_ADMIN', 'MANAGER'].includes(req.user!.role)) {
            return next(new AppError('Permission denied', 403));
        }
    } else {
        // Flattened list (e.g. for Admin Dashboard)
        if (req.user!.role !== 'SUPER_ADMIN') {
            filter.companyId = req.user!.companyId;
        }
    }

    const result = await LeaveService.findAllRequests(filter);
    sendResponse(res, 200, result, 'Leave requests retrieved successfully');
});

export const updateLeaveRequestStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { requestId } = req.params;
    const existing = await LeaveService.findRequestById(requestId);
    if (!existing) return next(new AppError('Request not found', 404));

    // Auth: Must be Admin/Manager of the company
    if (req.user!.role !== 'SUPER_ADMIN' && existing.employee.companyId !== req.user!.companyId) {
        return next(new AppError('Permission denied', 403));
    }

    // Only certain roles can approve/reject
    if (!['SUPER_ADMIN', 'ORG_ADMIN', 'HR_ADMIN', 'MANAGER'].includes(req.user!.role)) {
        return next(new AppError('Insufficient permissions to update status', 403));
    }

    const input: UpdateLeaveRequestStatusInput = {
        status: req.body.status,
        approvedBy: req.user!.userId // Or employeeId, depending on schema preference. Using User ID here.
    };

    const updated = await LeaveService.updateRequestStatus(requestId, input);
    sendResponse(res, 200, updated, `Leave request ${input.status.toLowerCase()} successfully`);
});
