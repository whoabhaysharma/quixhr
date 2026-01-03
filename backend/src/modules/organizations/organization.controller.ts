import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';
import { AppError } from '@/utils/appError';
import * as OrganizationService from './organization.service';
import { UpdateOrganizationInput } from './organization.types';

export const getOrganization = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = req.targetOrganizationId;

    if (!organizationId) {
        return next(new AppError('Organization context is required', 400));
    }

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
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = (req.query.sortOrder as string || 'desc') as 'asc' | 'desc';

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
    const organizationId = req.targetOrganizationId;

    if (!organizationId) {
        return next(new AppError('Organization context is required', 400));
    }

    const updatedOrganization = await OrganizationService.update(organizationId, req.body as UpdateOrganizationInput);
    sendResponse(res, 200, updatedOrganization, 'Organization updated successfully');
});

export const getDashboardStats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = req.targetOrganizationId;

    if (!organizationId) {
        return next(new AppError('Organization context is required', 400));
    }

    const stats = await OrganizationService.getDashboardStats(organizationId);

    sendResponse(res, 200, stats, 'Dashboard stats retrieved');
});

export const getOrganizationAuditLogs = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = req.targetOrganizationId;

    if (!organizationId) {
        return next(new AppError('Organization context is required', 400));
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = (req.query.sortOrder as string || 'desc') as 'asc' | 'desc';

    const logs = await OrganizationService.getAuditLogs(organizationId, { page, limit, sortBy, sortOrder });
    sendResponse(res, 200, logs, 'Audit logs retrieved');
});
