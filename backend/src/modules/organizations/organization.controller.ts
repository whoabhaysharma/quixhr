import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';
import { AppError } from '@/utils/appError';
import { getOrganizationContext } from '@/utils/tenantContext';
import { getPaginationParams } from '@/utils/pagination';
import * as OrganizationService from './organization.service';
import { UpdateOrganizationInput } from './organization.types';
import { MemberService } from '@/modules/members/members.service';
import { Role } from '@prisma/client';

export const getOrganization = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = getOrganizationContext(req, next);

    const organization = await OrganizationService.findById(organizationId);
    if (!organization) {
        return next(new AppError('Organization not found', 404));
    }

    sendResponse(res, 200, organization, 'Organization retrieved successfully');
});

export const createOrganization = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // Authorization handled by restrictTo middleware
    const organization = await OrganizationService.create(req.body);
    sendResponse(res, 201, organization, 'Organization created successfully');
});

export const getOrganizations = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // Authorization handled by restrictTo middleware
    const { page, limit, search, sortBy, sortOrder } = getPaginationParams(req, 'createdAt');

    const result = await OrganizationService.findAll({
        page,
        limit,
        search,
        sortBy,
        sortOrder
    });

    sendResponse(res, 200, result, 'Organizations retrieved successfully');
});

export const updateOrganization = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = getOrganizationContext(req, next);

    const updatedOrganization = await OrganizationService.update(organizationId, req.body as UpdateOrganizationInput);
    sendResponse(res, 200, updatedOrganization, 'Organization updated successfully');
});

export const getDashboardStats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = getOrganizationContext(req, next);

    const stats = await OrganizationService.getDashboardStats(organizationId);

    sendResponse(res, 200, stats, 'Dashboard stats retrieved');
});

export const getOrganizationAuditLogs = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = getOrganizationContext(req, next);

    const { page, limit, sortBy, sortOrder } = getPaginationParams(req, 'createdAt');

    const logs = await OrganizationService.getAuditLogs(organizationId, { page, limit, sortBy, sortOrder });
    sendResponse(res, 200, logs, 'Audit logs retrieved');
});

// =========================================================================
// MEMBER MANAGEMENT (Restricted Strict RBAC)
// =========================================================================

export const getMembers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = getOrganizationContext(req, next);
    const pagination = getPaginationParams(req, 'firstName', 'asc');

    const user = req.user!; // Checked by middleware

    const filters = {
        status: req.query.status as any,
        role: req.query.role as any,
        calendarId: req.query.calendarId as string,
        leaveGradeId: req.query.leaveGradeId as string,
    };

    // Delegates to MemberService which handles Role Hierarchy and Scope
    const result = await MemberService.getMembers(
        organizationId,
        user.role as Role,
        user.id,
        pagination,
        filters
    );
    sendResponse(res, 200, result, 'Members retrieved successfully');
});

export const removeMember = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = getOrganizationContext(req, next);
    const { employeeId } = req.params;

    const user = req.user!; // Checked by middleware

    // Delegates to MemberService which handles Safe Deletion and Hierarchy Checks
    await MemberService.deleteMember(organizationId, employeeId, user.role as Role);

    sendResponse(res, 200, null, 'Member removed successfully');
});
