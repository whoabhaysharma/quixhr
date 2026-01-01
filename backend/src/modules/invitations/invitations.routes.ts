import { Router } from 'express';
import * as InvitationController from './invitations.controller';
import { protect } from '@/shared/middleware/auth.middleware';
import { validate } from '@/shared/middleware';
import {
    acceptInvitationSchema,
    verifyInvitationSchema,
} from './invitations.schema';

const router = Router();

// =========================================================================
// PUBLIC ROUTES (No authentication required)
// =========================================================================

/**
 * @route   GET /api/v1/invitations/verify/:token
 * @desc    Verify invitation token and get details
 * @access  Public
 */
router.get(
    '/verify/:token',
    validate(verifyInvitationSchema),
    InvitationController.verifyInvitation
);

/**
 * @route   POST /api/v1/invitations/accept
 * @desc    Accept invitation and create account
 * @access  Public
 */
router.post(
    '/accept',
    validate(acceptInvitationSchema),
    InvitationController.acceptInvitation
);

// =========================================================================
// PROTECTED ROUTES (Authentication required)
// =========================================================================

/**
 * @route   POST /api/v1/invitations/:invitationId/resend
 * @desc    Resend an invitation
 * @access  Protected (HR_ADMIN, ORG_ADMIN, SUPER_ADMIN)
 */
router.post(
    '/:invitationId/resend',
    protect,
    InvitationController.resendInvitation
);

/**
 * @route   PATCH /api/v1/invitations/:invitationId/cancel
 * @desc    Cancel an invitation
 * @access  Protected (HR_ADMIN, ORG_ADMIN, SUPER_ADMIN)
 */
router.patch(
    '/:invitationId/cancel',
    protect,
    InvitationController.cancelInvitation
);

/**
 * @route   DELETE /api/v1/invitations/:invitationId
 * @desc    Delete an invitation
 * @access  Protected (HR_ADMIN, ORG_ADMIN, SUPER_ADMIN)
 */
router.delete(
    '/:invitationId',
    protect,
    InvitationController.deleteInvitation
);

export default router;
