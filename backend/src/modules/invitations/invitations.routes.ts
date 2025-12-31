import { Router } from 'express';
import { Role } from '@prisma/client';
import * as InvitationController from './invitations.controller';
import {
  createInvitationSchema,
  acceptInvitationSchema,
  getInvitationSchema,
  getInvitationsSchema,
  resendInvitationSchema,
  cancelInvitationSchema,
} from './invitations.schema';
import { restrictTo, validate } from '@/shared/middleware';

const router = Router();

// =========================================================================
// INVITATION ROUTES
// =========================================================================
// All routes here are already protected and have resolved tenant context
// from the parent companies router

/**
 * @route   GET /api/v1/companies/:companyId/invitations
 * @desc    Get all invitations for the company
 * @access  ORG_ADMIN, HR_ADMIN, SUPER_ADMIN
 */
router.get(
  '/',
  restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.SUPER_ADMIN),
  validate(getInvitationsSchema),
  InvitationController.getInvitations
);

/**
 * @route   POST /api/v1/companies/:companyId/invitations
 * @desc    Create a new invitation
 * @access  ORG_ADMIN, HR_ADMIN, SUPER_ADMIN
 */
router.post(
  '/',
  restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.SUPER_ADMIN),
  validate(createInvitationSchema),
  InvitationController.createInvitation
);

/**
 * @route   POST /api/v1/companies/:companyId/invitations/:invitationId/resend
 * @desc    Resend an invitation
 * @access  ORG_ADMIN, HR_ADMIN, SUPER_ADMIN
 */
router.post(
  '/:invitationId/resend',
  restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.SUPER_ADMIN),
  validate(resendInvitationSchema),
  InvitationController.resendInvitation
);

/**
 * @route   DELETE /api/v1/companies/:companyId/invitations/:invitationId
 * @desc    Cancel an invitation
 * @access  ORG_ADMIN, HR_ADMIN, SUPER_ADMIN
 */
router.delete(
  '/:invitationId',
  restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.SUPER_ADMIN),
  validate(cancelInvitationSchema),
  InvitationController.cancelInvitation
);

export default router;
