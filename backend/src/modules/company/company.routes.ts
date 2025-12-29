import { Router } from 'express';
import * as CompanyController from './company.controller';
import * as CompanySchema from './company.schema';
import { protect, restrictTo } from '@/modules/auth/auth.middleware';
import { resolveTenant } from '@/shared/middleware/tenantContext';
import validate from '@/shared/middleware/validateResource';
import { Role } from '@prisma/client';

const router = Router();

// All routes require authentication and tenant resolution
router.use(protect);
router.use(resolveTenant);

/**
 * @description  Get company settings (Timezone, Currency, Logo, Date Format)
 * @route        GET /api/v1/company/settings
 * @access       Org Admin
 */
router.get(
    '/settings',
    restrictTo(Role.ORG_ADMIN, Role.SUPER_ADMIN),
    CompanyController.getSettings
);

/**
 * @description  Update company settings (e.g., Change Timezone)
 * @route        PATCH /api/v1/company/settings
 * @access       Org Admin
 */
router.patch(
    '/settings',
    restrictTo(Role.ORG_ADMIN, Role.SUPER_ADMIN),
    validate(CompanySchema.updateSettingsSchema),
    CompanyController.updateSettings
);

/**
 * @description  Invite a new user (Email + Role)
 * @route        POST /api/v1/company/invite
 * @access       HR Admin
 */
router.post(
    '/invite',
    restrictTo(Role.HR_ADMIN, Role.ORG_ADMIN, Role.SUPER_ADMIN),
    validate(CompanySchema.inviteUserSchema),
    CompanyController.inviteUser
);

/**
 * @description  List pending invitations
 * @route        GET /api/v1/company/invites
 * @access       HR Admin
 */
router.get(
    '/invites',
    restrictTo(Role.HR_ADMIN, Role.ORG_ADMIN, Role.SUPER_ADMIN),
    validate(CompanySchema.listInvitesSchema),
    CompanyController.listInvites
);

/**
 * @description  Revoke an invitation
 * @route        DELETE /api/v1/company/invites/:id
 * @access       HR Admin
 */
router.delete(
    '/invites/:id',
    restrictTo(Role.HR_ADMIN, Role.ORG_ADMIN, Role.SUPER_ADMIN),
    validate(CompanySchema.revokeInviteSchema),
    CompanyController.revokeInvite
);

export default router;
