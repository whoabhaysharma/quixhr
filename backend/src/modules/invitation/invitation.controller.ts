import { Request, Response } from 'express';
import * as InvitationService from './invitation.service';
import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';

/**
 * @desc    Send invitation
 * @route   POST /api/v1/companies/:companyId/invitations
 * @access  Admin (HR Admin, Org Admin)
 */
export const sendInvitation = catchAsync(async (req: Request, res: Response) => {
    const { companyId } = req.params;
    const inviterRole = req.user?.role;

    if (!inviterRole) {
        return res.status(401).json({ message: 'User role not found' });
    }

    const invitation = await InvitationService.sendInvitation(companyId, inviterRole, req.body);

    sendResponse(res, 201, { invitation }, 'Invitation sent successfully');
});

/**
 * @desc    List pending invitations
 * @route   GET /api/v1/companies/:companyId/invitations
 * @access  Admin (HR Admin, Org Admin)
 */
export const listInvitations = catchAsync(async (req: Request, res: Response) => {
    const { companyId } = req.params;
    const filters = req.query;

    const invitations = await InvitationService.listInvitations(companyId, filters);

    sendResponse(
        res,
        200,
        { invitations, count: invitations.length },
        'Invitations retrieved successfully'
    );
});

/**
 * @desc    Revoke an invitation
 * @route   DELETE /api/v1/companies/:companyId/invitations/:id
 * @access  Admin (HR Admin, Org Admin)
 */
export const revokeInvitation = catchAsync(async (req: Request, res: Response) => {
    const { companyId, id } = req.params;

    const invitation = await InvitationService.revokeInvitation(id, companyId);

    sendResponse(res, 200, { invitation }, 'Invitation revoked successfully');
});

/**
 * @desc    Validate invitation token
 * @route   GET /api/v1/invitations/validate/:token
 * @access  Public
 */
export const validateToken = catchAsync(async (req: Request, res: Response) => {
    const { token } = req.params;

    const result = await InvitationService.validateToken(token);

    if (!result.valid) {
        return res.status(400).json({
            success: false,
            message: result.error,
        });
    }

    sendResponse(res, 200, result, 'Token is valid');
});

/**
 * @desc    Accept invitation
 * @route   POST /api/v1/invitations/accept
 * @access  Public
 */
export const acceptInvitation = catchAsync(async (req: Request, res: Response) => {
    const result = await InvitationService.acceptInvitation(req.body);

    sendResponse(res, 200, result, 'Invitation accepted successfully. You are now logged in.');
});
