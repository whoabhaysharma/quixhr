import { Request, Response } from 'express';
import * as CompanyService from './company.service';
import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';
import { Role } from '@prisma/client';

/**
 * @desc    Get company profile
 * @route   GET /api/v1/companies/:companyId
 * @access  Authenticated users of the company
 */
export const getCompanyProfile = catchAsync(async (req: Request, res: Response) => {
    const { companyId } = req.params;

    const company = await CompanyService.getCompanyProfile(companyId);

    sendResponse(res, 200, { company }, 'Company profile retrieved successfully');
});

/**
 * @desc    Update company settings
 * @route   PATCH /api/v1/companies/:companyId
 * @access  Org Admin
 */
export const updateCompanySettings = catchAsync(async (req: Request, res: Response) => {
    const { companyId } = req.params;

    const company = await CompanyService.updateCompanySettings(companyId, req.body);

    sendResponse(res, 200, { company }, 'Company settings updated successfully');
});

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/v1/companies/:companyId/dashboard
 * @access  HR Admin, Org Admin
 */
export const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
    const { companyId } = req.params;

    const stats = await CompanyService.getDashboardStats(companyId);

    sendResponse(res, 200, { stats }, 'Dashboard statistics retrieved successfully');
});

/**
 * @desc    List all system users
 * @route   GET /api/v1/users
 * @access  HR Admin
 */
export const listUsers = catchAsync(async (req: Request, res: Response) => {
    const companyId = req.targetCompanyId;

    if (!companyId) {
        return res.status(400).json({ message: 'Company ID is required' });
    }

    const roleFilter = req.query.role as Role | undefined;
    const users = await CompanyService.listUsers(companyId, roleFilter);

    sendResponse(res, 200, { users, count: users.length }, 'Users retrieved successfully');
});

/**
 * @desc    Update user role (Promote/Demote)
 * @route   PATCH /api/v1/users/:id/role
 * @access  Org Admin
 */
export const updateUserRole = catchAsync(async (req: Request, res: Response) => {
    const companyId = req.targetCompanyId;
    const updaterRole = req.user?.role;
    const { id } = req.params;

    if (!companyId) {
        return res.status(400).json({ message: 'Company ID is required' });
    }

    if (!updaterRole) {
        return res.status(401).json({ message: 'User role not found' });
    }

    const user = await CompanyService.updateUserRole(id, companyId, updaterRole, req.body);

    sendResponse(res, 200, { user }, 'User role updated successfully');
});

