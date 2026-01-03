import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';
import { AppError } from '@/utils/appError';
import { getOrganizationContext } from '@/utils/tenantContext';
import { InvitationService } from './invitations.service';
import {
    InvitationsListResponseDto,
    InvitationResponseDto,
    InvitationDetailsResponseDto,
    GetInvitationsQuery
} from './invitations.schema';

// =========================================================================
// INVITATION ENDPOINTS
// =========================================================================

/**
 * @desc    Create a new invitation
 * @route   POST /api/v1/org/:organizationId/invitations
 * @access  Protected (HR_ADMIN, ORG_ADMIN, SUPER_ADMIN)
 */
export const createInvitation = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const organizationId = getOrganizationContext(req, next);
        const { role: invitedRole } = req.body;

        const user = (req as any).user;
        if (!user) return next(new AppError('User not authenticated', 401));

        // Strict Role Hierarchy Check
        const { canInviteRole } = require('@/utils/roleHierarchy');
        if (!canInviteRole(user.role, invitedRole)) {
            return next(
                new AppError('You cannot invite a user with this role. You can only invite users with a role lower than yours.', 403)
            );
        }

        const invitation = await InvitationService.createInvitation(
            organizationId,
            req.body
        );

        const responseData = {
            success: true,
            message: 'Invitation sent successfully',
            data: {
                id: invitation.id,
                organizationId: invitation.organizationId,
                email: invitation.email,
                role: invitation.role,
                status: invitation.status,
                expiresAt: invitation.expiresAt,
            },
        };

        sendResponse(res, 201, responseData);
    }
);

/**
 * @desc    Get invitations (Scoped by tenant)
 * @route   GET /api/v1/invitations
 * @access  Protected (HR_ADMIN, ORG_ADMIN, SUPER_ADMIN)
 */
export const getInvitations = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const organizationId = getOrganizationContext(req, next);

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        // Explicit cast with validation could be better, but strict typing is requested
        const status = req.query.status as GetInvitationsQuery['status'];

        const email = req.query.email as string;
        const sortBy = req.query.sortBy as string || 'expiresAt';
        const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

        // Prepare pagination object (ParsedPagination)
        const skip = (page - 1) * limit;

        const result = await InvitationService.getInvitations(
            organizationId,
            { page, limit, skip, sortBy, sortOrder, search: '' },
            { status, email }
        );

        const responseData = {
            success: true,
            message: 'Invitations retrieved successfully',
            data: result
        };

        sendResponse(res, 200, responseData);
    }
);

/**
 * @desc    Verify invitation token (public)
 * @route   GET /api/v1/invitations/verify/:token
 * @access  Public
 */
export const verifyInvitation = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const { token } = req.params;

        const details = await InvitationService.verifyInvitationToken(token);

        const responseData = {
            success: true,
            message: 'Invitation verified successfully',
            data: details,
        };

        sendResponse(res, 200, responseData);
    }
);

/**
 * @desc    Accept invitation and create account (public)
 * @route   POST /api/v1/invitations/accept
 * @access  Public
 */
export const acceptInvitation = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const { token, firstName, lastName, password } = req.body;

        const result = await InvitationService.acceptInvitation(token, {
            token, // Pass token as part of input
            firstName,
            lastName,
            password,
        });

        const responseData = {
            success: true,
            message: 'Invitation accepted successfully. You can now login.',
            data: {
                userId: result.user.id,
                email: result.user.email,
                employeeId: result.employee.id,
            },
        };

        sendResponse(res, 200, responseData);
    }
);

/**
 * @desc    Resend invitation
 * @route   POST /api/v1/invitations/:invitationId/resend
 * @access  Protected (HR_ADMIN, ORG_ADMIN, SUPER_ADMIN)
 */
export const resendInvitation = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const organizationId = getOrganizationContext(req, next);
        const { invitationId } = req.params;

        const user = (req as any).user;
        if (!user) return next(new AppError('User not authenticated', 401));

        const invitation = await InvitationService.resendInvitation(
            invitationId,
            organizationId,
            user.role
        );

        const responseData = {
            success: true,
            message: 'Invitation resent successfully',
            data: {
                id: invitation.id,
                email: invitation.email,
                expiresAt: invitation.expiresAt,
            },
        };

        sendResponse(res, 200, responseData);
    }
);

/**
 * @desc    Cancel invitation
 * @route   PATCH /api/v1/invitations/:invitationId/cancel
 * @access  Protected (HR_ADMIN, ORG_ADMIN, SUPER_ADMIN)
 */
export const cancelInvitation = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const organizationId = getOrganizationContext(req, next);
        const { invitationId } = req.params;

        const user = (req as any).user;
        if (!user) return next(new AppError('User not authenticated', 401));

        const invitation = await InvitationService.cancelInvitation(
            invitationId,
            organizationId,
            user.role
        );

        const responseData = {
            success: true,
            message: 'Invitation cancelled successfully',
            data: {
                id: invitation.id,
                status: invitation.status,
            },
        };

        sendResponse(res, 200, responseData);
    }
);

/**
 * @desc    Delete invitation
 * @route   DELETE /api/v1/invitations/:invitationId
 * @access  Protected (HR_ADMIN, ORG_ADMIN, SUPER_ADMIN)
 */
export const deleteInvitation = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const organizationId = getOrganizationContext(req, next);
        const { invitationId } = req.params;

        const user = (req as any).user;
        if (!user) return next(new AppError('User not authenticated', 401));

        await InvitationService.deleteInvitation(
            invitationId,
            organizationId,
            user.role
        );

        const responseData = {
            success: true,
            message: 'Invitation deleted successfully',
            data: null,
        };

        sendResponse(res, 200, responseData);
    }
);
