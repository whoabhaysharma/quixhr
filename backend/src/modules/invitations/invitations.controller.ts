import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';
import { InvitationService } from './invitations.service';
import { AuthContext } from './invitations.types';
import { AppError } from '@/utils/appError';
import {
  InvitationResponseDto,
  InvitationsListResponseDto,
  InvitationDetailsResponseDto,
  InvitationAcceptanceResponseDto,
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
 * @desc    Get all invitations for a company
 * @route   GET /api/v1/companies/:companyId/invitations
 * @access  Protected (ORG_ADMIN, HR_ADMIN, SUPER_ADMIN)
 */
export const getInvitations = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authContext = getAuthContext(req);
    const { companyId } = req.params;
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const email = req.query.email as string;
    const role = req.query.role as any;
    const status = req.query.status as string;

    const result = await InvitationService.getInvitations({
      authContext,
      companyId,
      page,
      limit,
      email,
      role,
      status,
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
 * @desc    Get invitation details by token (for acceptance page)
 * @route   GET /api/v1/invitations/:token
 * @access  Public
 */
export const getInvitationByToken = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { token } = req.params;

    const invitation = await InvitationService.getInvitationByToken({ token });

    const responseData: InvitationDetailsResponseDto = {
      success: true,
      message: 'Invitation details retrieved successfully',
      data: invitation,
    };

    sendResponse(res, 200, responseData);
  }
);

/**
 * @desc    Create a new invitation
 * @route   POST /api/v1/companies/:companyId/invitations
 * @access  Protected (ORG_ADMIN, HR_ADMIN, SUPER_ADMIN)
 */
export const createInvitation = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authContext = getAuthContext(req);
    const { companyId } = req.params;
    
    const invitation = await InvitationService.createInvitation({
      authContext,
      companyId,
      data: req.body,
    });

    const responseData: InvitationResponseDto = {
      success: true,
      message: 'Invitation created and sent successfully',
      data: invitation,
    };

    sendResponse(res, 201, responseData);
  }
);

/**
 * @desc    Accept an invitation
 * @route   POST /api/v1/invitations/accept
 * @access  Public
 */
export const acceptInvitation = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await InvitationService.acceptInvitation({
      data: req.body,
    });

    const responseData: InvitationAcceptanceResponseDto = {
      success: true,
      message: 'Invitation accepted successfully. Welcome aboard!',
      data: result,
    };

    sendResponse(res, 201, responseData);
  }
);

/**
 * @desc    Resend an invitation
 * @route   POST /api/v1/companies/:companyId/invitations/:invitationId/resend
 * @access  Protected (ORG_ADMIN, HR_ADMIN, SUPER_ADMIN)
 */
export const resendInvitation = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authContext = getAuthContext(req);
    const { companyId, invitationId } = req.params;

    const invitation = await InvitationService.resendInvitation({
      authContext,
      companyId,
      invitationId,
    });

    const responseData: InvitationResponseDto = {
      success: true,
      message: 'Invitation resent successfully',
      data: invitation,
    };

    sendResponse(res, 200, responseData);
  }
);

/**
 * @desc    Cancel an invitation
 * @route   DELETE /api/v1/companies/:companyId/invitations/:invitationId
 * @access  Protected (ORG_ADMIN, HR_ADMIN, SUPER_ADMIN)
 */
export const cancelInvitation = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authContext = getAuthContext(req);
    const { companyId, invitationId } = req.params;

    await InvitationService.cancelInvitation({
      authContext,
      companyId,
      invitationId,
    });

    const responseData = {
      success: true,
      message: 'Invitation cancelled successfully',
      data: null,
    };

    sendResponse(res, 200, responseData);
  }
);