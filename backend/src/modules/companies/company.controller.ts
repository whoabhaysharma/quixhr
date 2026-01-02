import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';
import { AppError } from '@/utils/appError';
import * as CompanyService from './company.service';
import { UpdateCompanyInput } from './company.types';

export const getCompany = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { companyId } = req.params;

    // Authorization matches resolveTenant + restrictTo + manual check if needed
    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.companyId !== companyId) {
        return next(new AppError('You do not have permission to view this company', 403));
    }

    const company = await CompanyService.findById(companyId);
    if (!company) {
        return next(new AppError('Company not found', 404));
    }

    sendResponse(res, 200, company, 'Company retrieved successfully');
});

export const createCompany = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // Only Super Admin
    if (req.user!.role !== 'SUPER_ADMIN') {
        return next(new AppError('Permission denied', 403));
    }

    const company = await CompanyService.create(req.body);
    sendResponse(res, 201, company, 'Company created successfully');
});

export const getCompanies = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // Only Super Admin
    if (req.user!.role !== 'SUPER_ADMIN') {
        return next(new AppError('Permission denied', 403));
    }

    const { page = 1, limit = 10, search } = req.query;

    const result = await CompanyService.findAll({
        page: Number(page),
        limit: Number(limit),
        search: search as string
    });

    sendResponse(res, 200, result, 'Companies retrieved successfully');
});

export const updateCompany = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { companyId } = req.params;

    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.companyId !== companyId) {
        return next(new AppError('You do not have permission to update this company', 403));
    }

    const updatedCompany = await CompanyService.update(companyId, req.body as UpdateCompanyInput);
    sendResponse(res, 200, updatedCompany, 'Company updated successfully');
});

export const getDashboardStats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { companyId } = req.params;

    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.companyId !== companyId) {
        return next(new AppError('Permission denied', 403));
    }

    const stats = await CompanyService.getDashboardStats(companyId);

    sendResponse(res, 200, stats, 'Dashboard stats retrieved');
});

export const getCompanyAuditLogs = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { companyId } = req.params;

    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.companyId !== companyId) {
        return next(new AppError('Permission denied', 403));
    }

    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    const logs = await CompanyService.getAuditLogs(companyId, { page, limit });
    sendResponse(res, 200, logs, 'Audit logs retrieved');
});
