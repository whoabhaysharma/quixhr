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

    // Placeholder for actual stats
    const stats = {
        employeesCode: 0,
        activeSchedules: 0,
        pendingLeaves: 0
    };

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

/*
export const initiateUpgrade = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    sendResponse(res, 200, { message: 'Upgrade logic not implemented' }, 'Upgrade initiated');
});

export const getBillingHistory = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    sendResponse(res, 200, [], 'Billing history retrieved');
});
*/
