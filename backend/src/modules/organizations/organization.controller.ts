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
