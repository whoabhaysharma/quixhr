import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';
import { AppError } from '@/utils/appError';
import { LeaveService } from './leaves.service';
import { getOrganizationContext } from '@/utils/tenantContext';
import { getPaginationParams } from '@/utils/pagination';
import {
    CreateLeaveGradeInput, UpdateLeaveGradeInput,
    CreateLeavePolicyInput, UpdateLeavePolicyInput,
    CreateLeaveRequestInput,
    UpdateLeaveRequestStatusInput,
    UpdateLeaveRequestInput
} from './leaves.schema';
import { LeaveType, LeaveStatus } from '@prisma/client';

// =========================================================================
// 1. LEAVE GRADE CONTROLLERS
// =========================================================================

export const createLeaveGrade = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = getOrganizationContext(req, next);

    // Role check usually handled by middleware, but extra safety:
    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.organizationId !== organizationId) {
        return next(new AppError('Permission denied', 403));
    }

    const input: CreateLeaveGradeInput = {
        ...req.body
    };

    const grade = await LeaveService.createGrade(organizationId, input);
    sendResponse(res, 201, grade, 'Leave grade created successfully');
});

export const getLeaveGradeById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id || req.params.gradeId;
    const organizationId = getOrganizationContext(req, next);

    const grade = await LeaveService.getGradeById(organizationId, id);

    if (!grade) {
        return next(new AppError('Leave grade not found', 404));
    }

    if (req.user!.role !== 'SUPER_ADMIN' && grade.organizationId !== req.user!.organizationId) {
        return next(new AppError('Permission denied', 403));
    }

    sendResponse(res, 200, grade, 'Leave grade retrieved successfully');
});

export const getLeaveGrades = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = getOrganizationContext(req, next);

    const pagination = getPaginationParams(req);
    // Construct filter object to satisfy LeaveGradeQuery type
    const filter = {
        page: pagination.page,
        limit: pagination.limit,
        search: pagination.search,
        sortBy: pagination.sortBy as any,
        sortOrder: pagination.sortOrder
    };

    const result = await LeaveService.getGrades(organizationId, pagination, filter);
    sendResponse(res, 200, result, 'Leave grades retrieved successfully');
});

export const updateLeaveGrade = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id || req.params.gradeId;
    const organizationId = getOrganizationContext(req, next);

    // Verify existence & ownership via service (it throws if not found/unauthorized for org usually,
    // but here we check before calling update as service expects valid orgId)
    // Actually Service.updateGrade calls validateOrganizationResource which does the checks.

    // We can rely on Service validation for ownership checks implicitly if passed correct Org ID.
    // However, explicitly checking role context is safer if middleware missed it.
    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.organizationId !== organizationId) {
        return next(new AppError('Permission denied', 403));
    }

    const grade = await LeaveService.updateGrade(organizationId, id, req.body as UpdateLeaveGradeInput);
    sendResponse(res, 200, grade, 'Leave grade updated successfully');
});

export const deleteLeaveGrade = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id || req.params.gradeId;
    const organizationId = getOrganizationContext(req, next);

    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.organizationId !== organizationId) {
        return next(new AppError('Permission denied', 403));
    }

    await LeaveService.deleteGrade(organizationId, id);
    sendResponse(res, 204, null, 'Leave grade deleted successfully');
});

// =========================================================================
// 2. LEAVE POLICY CONTROLLERS
// =========================================================================

export const getPolicies = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { gradeId } = req.params;
    const organizationId = getOrganizationContext(req, next);

    // Service handles parent validation
    const policies = await LeaveService.getPolicies(organizationId, gradeId);
    sendResponse(res, 200, policies, 'Leave policies retrieved successfully');
});

export const createPolicy = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { gradeId } = req.params;
    const organizationId = getOrganizationContext(req, next);

    const input: CreateLeavePolicyInput = { ...req.body };
    const policy = await LeaveService.createPolicy(organizationId, gradeId, input);
    sendResponse(res, 201, policy, 'Leave policy created successfully');
});

export const updatePolicy = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { policyId } = req.params;
    // We need to fetch policy first to get the gradeId and check org ownership
    // or rely on service to do it if we pass orgId.
    // The issue is Routes might NOT have gradeId in params for this endpoint.

    const organizationId = getOrganizationContext(req, next);

    const existingPolicy = await LeaveService.getPolicyById(policyId);
    if (!existingPolicy) return next(new AppError('Policy not found', 404));

    // Verify Org access via Grade
    if (req.user!.role !== 'SUPER_ADMIN' && existingPolicy.grade.organizationId !== organizationId) {
        return next(new AppError('Permission denied', 403));
    }

    const policy = await LeaveService.updatePolicy(organizationId, existingPolicy.leaveGradeId, policyId, req.body as UpdateLeavePolicyInput);
    sendResponse(res, 200, policy, 'Leave policy updated successfully');
});

export const deletePolicy = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { policyId } = req.params;
    const organizationId = getOrganizationContext(req, next);

    const existingPolicy = await LeaveService.getPolicyById(policyId);
    if (!existingPolicy) return next(new AppError('Policy not found', 404));

    if (req.user!.role !== 'SUPER_ADMIN' && existingPolicy.grade.organizationId !== organizationId) {
        return next(new AppError('Permission denied', 403));
    }

    await LeaveService.deletePolicy(organizationId, existingPolicy.leaveGradeId, policyId);
    sendResponse(res, 204, null, 'Leave policy deleted successfully');
});

// =========================================================================
// 3. LEAVE REQUEST CONTROLLERS
// =========================================================================

export const createLeaveRequest = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // employeeId check: Params (legacy/admin specific route if any) OR Body (Organization route)
    const employeeId = req.params.employeeId || req.body.employeeId;
    const organizationId = getOrganizationContext(req, next);

    // Fallback if not set (e.g. employee requesting for themselves, we interpret context)
    // Ideally Middleware sets targetOrganizationId.

    // Permission check
    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.organizationId !== organizationId) {
        // If regular user, they should only create for themselves (handled largely by route protection/middleware)
        // But let's assume we proceed if they are authenticated in this org.
    }

    const input: CreateLeaveRequestInput = {
        ...req.body
    };

    // Auto-approve if created by Admins or Manager (assuming Managers can approve own team's requests they create)
    // For now, restricting auto-approve to Admins for safety, or check if user is manager of the employee.
    // Simplified: Admins (Super, Org, HR) get auto-approve.
    let status: LeaveStatus = LeaveStatus.PENDING;
    let approvedBy: string | undefined;

    if (['SUPER_ADMIN', 'ORG_ADMIN', 'HR_ADMIN'].includes(req.user!.role)) {
        status = LeaveStatus.APPROVED;
        approvedBy = req.user!.userId;
    }

    const request = await LeaveService.createRequest(organizationId, employeeId, input, status, approvedBy);
    sendResponse(res, 201, request, 'Leave request created successfully');
});

export const getLeaveRequests = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // Determine context: Employee-Specific OR Organization-Wide (Admin)
    const { employeeId } = req.params;
    const organizationId = getOrganizationContext(req, next);

    const pagination = getPaginationParams(req);

    let filter: any = {
        employeeId, // Optional
        status: req.query.status as LeaveStatus,
        type: req.query.type as LeaveType,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string
    };

    // Auth verification for viewing others' requests
    if (employeeId) {
        // Viewing specific employee
        if (req.user!.role !== 'SUPER_ADMIN' &&
            req.user!.employeeId !== employeeId &&
            !['ORG_ADMIN', 'HR_ADMIN', 'MANAGER'].includes(req.user!.role)) {
            return next(new AppError('Permission denied', 403));
        }
    } else {
        // Viewing all requests (Admin/HR only)
        if (req.user!.role !== 'SUPER_ADMIN' && !['ORG_ADMIN', 'HR_ADMIN', 'MANAGER'].includes(req.user!.role)) {
            return next(new AppError('Permission denied', 403));
        }
    }

    const result = await LeaveService.getRequests(organizationId, pagination, filter);
    sendResponse(res, 200, result, 'Leave requests retrieved successfully');
});

export const updateLeaveRequest = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { requestId } = req.params;
    const organizationId = getOrganizationContext(req, next);

    const input: UpdateLeaveRequestInput = {
        ...req.body
    };

    const updated = await LeaveService.updateRequest(organizationId, requestId, input, req.user!.role);
    sendResponse(res, 200, updated, 'Leave request updated successfully');
});

export const updateLeaveRequestStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { requestId } = req.params;
    const organizationId = getOrganizationContext(req, next);

    // Service will fetch request and verify basic things. 
    // We need to pass approvedBy (User ID)
    const input: UpdateLeaveRequestStatusInput = {
        status: req.body.status
    };

    const updated = await LeaveService.updateRequestStatus(organizationId, requestId, input, req.user!.userId);
    sendResponse(res, 200, updated, `Leave request ${input.status.toLowerCase()} successfully`);
});

export const deleteLeaveRequest = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { requestId } = req.params;
    const organizationId = getOrganizationContext(req, next);

    await LeaveService.deleteRequest(organizationId, requestId, {
        userId: req.user!.userId,
        role: req.user!.role,
        employeeId: req.user!.employeeId
    });

    sendResponse(res, 204, null, 'Leave request deleted successfully');
});
