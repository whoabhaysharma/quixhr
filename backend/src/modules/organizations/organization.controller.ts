import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';
import { AppError } from '@/utils/appError';
import { getOrganizationContext } from '@/utils/tenantContext';
import { getPaginationParams } from '@/utils/pagination';
import * as OrganizationService from './organization.service';
import { UpdateOrganizationInput } from './organization.types';

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

export const getAvailability = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = getOrganizationContext(req, next);
    const { startDate, endDate } = req.query as { startDate?: string, endDate?: string };

    const data = await OrganizationService.getAvailability(organizationId, { startDate, endDate });
    sendResponse(res, 200, data, 'Availability data retrieved');
});

// =========================================================================
// MEMBER MANAGEMENT (Restricted Strict RBAC)
// =========================================================================

export const getMembers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = getOrganizationContext(req, next);
    const pagination = getPaginationParams(req, 'firstName', 'asc');

    const user = (req as any).user;
    if (!user) return next(new AppError('User not authenticated', 401));

    // Import dynamically to avoid circular dependency
    const { MemberService } = require('../members');
    const { getViewableRoles } = require('@/utils/roleHierarchy');

    // 1. Determine Access
    // "Higher rank role can get the lower rank role list"
    // We interpret this as: Viewer can see roles <= Viewer Role.
    const allowedRoles = getViewableRoles(user.role);

    // 2. Extract Filters
    const filters = {
        status: req.query.status as any,
        role: req.query.role as any, // User might specifically request "SHOW ME MANAGERS"
        // Pass allowedRoles to restrict the query
        allowedRoles
    };

    // 3. Query
    const result = await MemberService.getEmployees(organizationId, pagination, filters);
    sendResponse(res, 200, result, 'Members retrieved successfully');
});

export const removeMember = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = getOrganizationContext(req, next);
    const { employeeId } = req.params;

    const user = (req as any).user;
    if (!user) return next(new AppError('User not authenticated', 401));
    const currentUserRole = user.role;

    const { MemberService } = require('../members');
    const { canManageRole } = require('@/utils/roleHierarchy');

    // 1. Get the target employee to find their user role
    const targetEmployee = await MemberService.getEmployee(organizationId, employeeId);

    if (!targetEmployee) {
        return next(new AppError('Employee not found', 404));
    }

    const targetUserRole = targetEmployee.user.role;

    // 2. Strict Hierarchy Check
    if (!canManageRole(currentUserRole, targetUserRole)) {
        return next(new AppError('You cannot remove this member. You can only remove members with a role lower than yours.', 403));
    }

    // 3. Proceed to delete
    await MemberService.deleteEmployee(organizationId, employeeId, currentUserRole);

    sendResponse(res, 200, null, 'Member removed successfully');
});


