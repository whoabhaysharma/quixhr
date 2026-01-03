import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';
import { AppError } from '@/utils/appError';
import { InvitationService } from './invitations.service';
import { AuthContext } from './invitations.types';
import {
    InvitationsListResponseDto,
    InvitationResponseDto,
    InvitationDetailsResponseDto,
} from './invitations.schema';

// =========================================================================
// HELPER FUNCTIONS
// =========================================================================

/**
 * Get auth context from request
 */
const getAuthContext = (req: Request): AuthContext => {
    const user = (req as any).user;
    if (!user) {
        throw new AppError('User not authenticated', 401);
    }
    return user as AuthContext;
};

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
        const authContext = getAuthContext(req);
        const { organizationId } = req.params;

        // Validate organization access
        if (
            authContext.role !== 'SUPER_ADMIN' &&
            authContext.organizationId !== organizationId
        ) {
            return next(
                new AppError('Access denied. You can only invite to your own organization.', 403)
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
        const organizationId = req.targetOrganizationId;

        if (!organizationId) {
            return next(new AppError('Organization context is required', 400));
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const status = req.query.status as string;
        const email = req.query.email as string;

        const result = await InvitationService.getInvitations(organizationId, {
            page,
            limit,
            status,
            email,
        });

        const responseData: InvitationsListResponseDto = {
            success: true,
            message: 'Invitations retrieved successfully',
            data: {
                invitations: result.invitations,
                pagination: result.pagination,
            },
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

        const responseData: InvitationDetailsResponseDto = {
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
        const authContext = getAuthContext(req);
        const { invitationId } = req.params;

        // Use targetOrganizationId if resolved, or fall back to user's organization for safety if middleware not applied (though it should be)
        const organizationId = req.targetOrganizationId || authContext.organizationId || '';

        // Get invitation to check organization access
        const invitation = await InvitationService.resendInvitation(
            invitationId,
            organizationId,
            authContext.role
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
        const authContext = getAuthContext(req);
        const { invitationId } = req.params;
        const organizationId = req.targetOrganizationId || authContext.organizationId || '';

        const invitation = await InvitationService.cancelInvitation(
            invitationId,
            organizationId,
            authContext.role
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
        const authContext = getAuthContext(req);
        const { invitationId } = req.params;
        const organizationId = req.targetOrganizationId || authContext.organizationId || '';

        await InvitationService.deleteInvitation(
            invitationId,
            organizationId,
            authContext.role
        );

        const responseData = {
            success: true,
            message: 'Invitation deleted successfully',
            data: null,
        };

        sendResponse(res, 200, responseData);
    }
);
