import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';
import { AppError } from '@/utils/appError';
import { LeaveService } from './leaves.service';
import {
    CreateLeaveGradeInput, UpdateLeaveGradeInput,
    CreateLeavePolicyInput, UpdateLeavePolicyInput,
    CreateLeaveRequestInput, UpdateLeaveRequestStatusInput
} from './leaves.schema';
import { LeaveStatus, LeaveType } from '@prisma/client';

// =========================================================================
// HELPER FUNCTIONS
// =========================================================================

const getOrganizationId = (req: Request): string => {
    // Priority: targetOrganizationId (from tenant middleware) > user.organizationId
    if (req.targetOrganizationId) return req.targetOrganizationId;
    if (req.user?.organizationId) return req.user.organizationId;
    throw new AppError('Organization context required', 400);
};

// =========================================================================
// 1. LEAVE GRADE CONTROLLERS
// =========================================================================

export const createLeaveGrade = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = getOrganizationId(req);
    const input: CreateLeaveGradeInput = req.body;

    const grade = await LeaveService.createGrade(organizationId, input);
    sendResponse(res, 201, grade, 'Leave grade created successfully');
});

export const getLeaveGradeById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = getOrganizationId(req);
    const id = req.params.id || req.params.gradeId;

    const grade = await LeaveService.getGradeById(organizationId, id);

    if (!grade) {
        return next(new AppError('Leave grade not found', 404));
    }

    sendResponse(res, 200, grade, 'Leave grade retrieved successfully');
});

export const getLeaveGrades = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = getOrganizationId(req);

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const filters = {
         search: req.query.search as string
    };
    const pagination = { page, limit, skip, sortBy: req.query.sortBy as string, sortOrder: req.query.sortOrder as 'asc' | 'desc', search: req.query.search as string };

    const result = await LeaveService.getGrades(organizationId, pagination, filters);
    sendResponse(res, 200, result, 'Leave grades retrieved successfully');
});

export const updateLeaveGrade = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = getOrganizationId(req);
    const id = req.params.id || req.params.gradeId;

    const grade = await LeaveService.updateGrade(organizationId, id, req.body as UpdateLeaveGradeInput);
    sendResponse(res, 200, grade, 'Leave grade updated successfully');
});

export const deleteLeaveGrade = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = getOrganizationId(req);
    const id = req.params.id || req.params.gradeId;

    await LeaveService.deleteGrade(organizationId, id);
    sendResponse(res, 204, null, 'Leave grade deleted successfully');
});

// =========================================================================
// 2. LEAVE POLICY CONTROLLERS
// =========================================================================

export const getPolicies = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = getOrganizationId(req);
    const { gradeId } = req.params;

    const policies = await LeaveService.getPolicies(organizationId, gradeId);
    sendResponse(res, 200, policies, 'Leave policies retrieved successfully');
});

export const createPolicy = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = getOrganizationId(req);
    const { gradeId } = req.params;

    const input: CreateLeavePolicyInput = req.body;
    const policy = await LeaveService.createPolicy(organizationId, gradeId, input);
    sendResponse(res, 201, policy, 'Leave policy created successfully');
});

export const updatePolicy = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = getOrganizationId(req);
    const { policyId } = req.params;

    const existingPolicy = await LeaveService.getPolicyById(organizationId, policyId);
    if (!existingPolicy) {
        return next(new AppError('Leave policy not found', 404));
    }

    const policy = await LeaveService.updatePolicy(organizationId, existingPolicy.leaveGradeId, policyId, req.body as UpdateLeavePolicyInput);
    sendResponse(res, 200, policy, 'Leave policy updated successfully');
});

export const deletePolicy = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = getOrganizationId(req);
    const { policyId } = req.params;

    const existingPolicy = await LeaveService.getPolicyById(organizationId, policyId);
    if (!existingPolicy) {
        return next(new AppError('Leave policy not found', 404));
    }

    await LeaveService.deletePolicy(organizationId, existingPolicy.leaveGradeId, policyId);
    sendResponse(res, 204, null, 'Leave policy deleted successfully');
});

// =========================================================================
// 3. LEAVE REQUEST CONTROLLERS
// =========================================================================

export const createLeaveRequest = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = getOrganizationId(req);
    const employeeId = req.params.id || req.user?.employeeId;

    if (!employeeId) {
        return next(new AppError('Employee ID required', 400));
    }

    const input: CreateLeaveRequestInput = req.body;
    const request = await LeaveService.createRequest(organizationId, employeeId, input);
    sendResponse(res, 201, request, 'Leave request created successfully');
});

export const getLeaveRequests = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = getOrganizationId(req);
    const { employeeId } = req.params;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    let filters: any = {
        status: req.query.status as LeaveStatus,
        type: req.query.type as LeaveType,
        employeeId: employeeId || req.query.employeeId as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string
    };

    const pagination = { page, limit, skip, sortBy: req.query.sortBy as string, sortOrder: req.query.sortOrder as 'asc' | 'desc' };

    const result = await LeaveService.getRequests(organizationId, pagination, filters);
    sendResponse(res, 200, result, 'Leave requests retrieved successfully');
});

export const updateLeaveRequestStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = getOrganizationId(req);
    const { requestId } = req.params;

    const approvedBy = req.user?.userId;

    const input: UpdateLeaveRequestStatusInput = {
        status: req.body.status,
    };

    const updated = await LeaveService.updateRequestStatus(organizationId, requestId, input, approvedBy);
    sendResponse(res, 200, updated, `Leave request ${input.status.toLowerCase()} successfully`);
});
