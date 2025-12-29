import { Router } from 'express';
import * as CompanyController from '../company/company.controller';
import * as CompanySchema from '../company/company.schema';
import { protect, restrictTo } from '@/modules/auth/auth.middleware';
import { resolveTenant } from '@/shared/middleware/tenantContext';
import validate from '@/shared/middleware/validateResource';
import { Role } from '@prisma/client';

const router = Router();

// All routes require authentication and tenant resolution
router.use(protect);
router.use(resolveTenant);

/**
 * @description  List all system users
 * @route        GET /api/v1/users
 * @access       HR Admin
 */
router.get(
    '/',
    restrictTo(Role.HR_ADMIN, Role.ORG_ADMIN, Role.SUPER_ADMIN),
    validate(CompanySchema.listUsersSchema),
    CompanyController.listUsers
);

/**
 * @description  Update user role - Promote/Demote (e.g., Manager -> HR)
 * @route        PATCH /api/v1/users/:id/role
 * @access       Org Admin
 */
router.patch(
    '/:id/role',
    restrictTo(Role.ORG_ADMIN, Role.SUPER_ADMIN),
    validate(CompanySchema.updateUserRoleSchema),
    CompanyController.updateUserRole
);

export default router;
