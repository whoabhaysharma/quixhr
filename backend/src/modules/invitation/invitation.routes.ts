import { Router } from 'express';
import * as InvitationController from './invitation.controller';
import * as InvitationSchema from './invitation.schema';
import { protect, restrictTo } from '@/modules/auth/auth.middleware';
import validate from '@/shared/middleware/validateResource';
import { Role } from '@prisma/client';

const router = Router();

/**
 * PUBLIC ROUTES (No authentication required)
 */

/**
 * @route   GET /api/v1/invitations/validate/:token
 * @desc    Public. Validate token & show "Join {Company}" screen
 * @access  Public
 */
router.get(
    '/validate/:token',
    validate(InvitationSchema.validateTokenSchema),
    InvitationController.validateToken
);

/**
 * @route   POST /api/v1/invitations/accept
 * @desc    Public. User sets name/password & accepts invite
 * @access  Public
 */
router.post(
    '/accept',
    validate(InvitationSchema.acceptInvitationSchema),
    InvitationController.acceptInvitation
);

/**
 * AUTHENTICATED ROUTES (Require authentication and admin role)
 */

// All routes below require authentication
router.use(protect);

/**
 * @route   POST /api/v1/companies/:companyId/invitations
 * @desc    Send Invite. Body: { email, role }
 * @access  Admin (HR Admin, Org Admin)
 */
router.post(
    '/companies/:companyId/invitations',
    restrictTo(Role.HR_ADMIN, Role.ORG_ADMIN, Role.SUPER_ADMIN),
    validate(InvitationSchema.sendInvitationSchema),
    InvitationController.sendInvitation
);

/**
 * @route   GET /api/v1/companies/:companyId/invitations
 * @desc    List pending invitations
 * @access  Admin (HR Admin, Org Admin)
 */
router.get(
    '/companies/:companyId/invitations',
    restrictTo(Role.HR_ADMIN, Role.ORG_ADMIN, Role.SUPER_ADMIN),
    validate(InvitationSchema.listInvitationsSchema),
    InvitationController.listInvitations
);

/**
 * @route   DELETE /api/v1/companies/:companyId/invitations/:id
 * @desc    Cancel/Revoke an invitation
 * @access  Admin (HR Admin, Org Admin)
 */
router.delete(
    '/companies/:companyId/invitations/:id',
    restrictTo(Role.HR_ADMIN, Role.ORG_ADMIN, Role.SUPER_ADMIN),
    validate(InvitationSchema.revokeInvitationSchema),
    InvitationController.revokeInvitation
);

export default router;
