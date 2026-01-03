import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';
import { AppError } from '@/utils/appError';
import * as OrganizationService from './organization.service';
import { UpdateOrganizationInput } from './organization.types';

export const getOrganization = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { organizationId } = req.params;

    // Authorization matches resolveTenant + restrictTo + manual check if needed
    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.organizationId !== organizationId) {
        return next(new AppError('You do not have permission to view this organization', 403));
    }

    const organization = await OrganizationService.findById(organizationId);
    if (!organization) {
        return next(new AppError('Organization not found', 404));
    }

    sendResponse(res, 200, organization, 'Organization retrieved successfully');
});

export const createOrganization = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // Only Super Admin
    if (req.user!.role !== 'SUPER_ADMIN') {
        return next(new AppError('Permission denied', 403));
    }

    const organization = await OrganizationService.create(req.body);
    sendResponse(res, 201, organization, 'Organization created successfully');
});

export const getOrganizations = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // Only Super Admin
    if (req.user!.role !== 'SUPER_ADMIN') {
        return next(new AppError('Permission denied', 403));
    }

    const { page = 1, limit = 10, search } = req.query;

    const result = await OrganizationService.findAll({
        page: Number(page),
        limit: Number(limit),
        search: search as string
    });

    sendResponse(res, 200, result, 'Organizations retrieved successfully');
});

export const updateOrganization = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { organizationId } = req.params;

    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.organizationId !== organizationId) {
        return next(new AppError('You do not have permission to update this organization', 403));
    }

    const updatedOrganization = await OrganizationService.update(organizationId, req.body as UpdateOrganizationInput);
    sendResponse(res, 200, updatedOrganization, 'Organization updated successfully');
});

export const getDashboardStats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { organizationId } = req.params;

    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.organizationId !== organizationId) {
        return next(new AppError('Permission denied', 403));
    }

    const stats = await OrganizationService.getDashboardStats(organizationId);

    sendResponse(res, 200, stats, 'Dashboard stats retrieved');
});

export const getOrganizationAuditLogs = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { organizationId } = req.params;

    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.organizationId !== organizationId) {
        return next(new AppError('Permission denied', 403));
    }

    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    const logs = await OrganizationService.getAuditLogs(organizationId, { page, limit });
    sendResponse(res, 200, logs, 'Audit logs retrieved');
});
