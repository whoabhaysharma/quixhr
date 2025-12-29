import { Request, Response } from 'express';
import * as CompanyService from './company.service';
import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';
import { Role } from '@prisma/client';

/**
 * @desc    Get company settings
 * @route   GET /api/v1/company/settings
 * @access  Org Admin
 */
export const getSettings = catchAsync(async (req: Request, res: Response) => {
    const companyId = req.targetCompanyId;

    if (!companyId) {
        return res.status(400).json({ message: 'Company ID is required' });
    }

    const settings = await CompanyService.getCompanySettings(companyId);

    sendResponse(res, 200, { company: settings }, 'Company settings retrieved successfully');
});

/**
 * @desc    Update company settings
 * @route   PATCH /api/v1/company/settings
 * @access  Org Admin
 */
export const updateSettings = catchAsync(async (req: Request, res: Response) => {
    const companyId = req.targetCompanyId;

    if (!companyId) {
        return res.status(400).json({ message: 'Company ID is required' });
    }

    const settings = await CompanyService.updateCompanySettings(companyId, req.body);

    sendResponse(res, 200, { company: settings }, 'Company settings updated successfully');
});

/**
 * @desc    Invite a new user
 * @route   POST /api/v1/company/invite
 * @access  HR Admin
 */
export const inviteUser = catchAsync(async (req: Request, res: Response) => {
    const companyId = req.targetCompanyId;
    const inviterRole = req.user?.role;

    if (!companyId) {
        return res.status(400).json({ message: 'Company ID is required' });
    }

    if (!inviterRole) {
        return res.status(401).json({ message: 'User role not found' });
    }

    const invitation = await CompanyService.inviteUser(companyId, inviterRole, req.body);

    sendResponse(res, 201, { invitation }, 'Invitation sent successfully');
});

/**
 * @desc    List pending invitations
 * @route   GET /api/v1/company/invites
 * @access  HR Admin
 */
export const listInvites = catchAsync(async (req: Request, res: Response) => {
    const companyId = req.targetCompanyId;

    if (!companyId) {
        return res.status(400).json({ message: 'Company ID is required' });
    }

    const filters = req.query;
    const invitations = await CompanyService.listInvitations(companyId, filters);

    sendResponse(res, 200, { invitations, count: invitations.length }, 'Invitations retrieved successfully');
});

/**
 * @desc    Revoke an invitation
 * @route   DELETE /api/v1/company/invites/:id
 * @access  HR Admin
 */
export const revokeInvite = catchAsync(async (req: Request, res: Response) => {
    const companyId = req.targetCompanyId;
    const { id } = req.params;

    if (!companyId) {
        return res.status(400).json({ message: 'Company ID is required' });
    }

    const invitation = await CompanyService.revokeInvitation(id, companyId);

    sendResponse(res, 200, { invitation }, 'Invitation revoked successfully');
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
