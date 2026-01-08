import { Router } from 'express';
import { Role } from '@prisma/client';
import * as InvitationController from './invitations.controller';
import { protect, validate, resolveTenant, restrictTo } from '@/shared/middleware';
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

// Global Middleware: Resolve Tenant
router.use(protect);

/**
 * @route   GET /api/v1/invitations
 * @desc    Get invitations (Scoped by tenant)
 * @access  Protected (HR_ADMIN, ORG_ADMIN, SUPER_ADMIN)
 */
router.get(
    '/',
    resolveTenant,
    restrictTo(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN),
    // validate(getInvitationsSchema), // Need to export/import this schema if validation is desired
    InvitationController.getInvitations
);

// Resend
router.post(
    '/:invitationId/resend',
    resolveTenant,
    InvitationController.resendInvitation
);

/**
 * @route   PATCH /api/v1/invitations/:invitationId/cancel
 * @desc    Cancel an invitation
 * @access  Protected (HR_ADMIN, ORG_ADMIN, SUPER_ADMIN)
 */
router.patch(
    '/:invitationId/cancel',
    resolveTenant,
    InvitationController.cancelInvitation
);

/**
 * @route   DELETE /api/v1/invitations/:invitationId
 * @desc    Delete an invitation
 * @access  Protected (HR_ADMIN, ORG_ADMIN, SUPER_ADMIN)
 */
router.delete(
    '/:invitationId',
    resolveTenant,
    InvitationController.deleteInvitation
);

export default router;
