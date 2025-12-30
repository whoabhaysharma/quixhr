import { Router } from 'express';
import * as CompanyController from './company.controller';
import * as CompanySchema from './company.schema';
import { protect, restrictTo } from '@/modules/auth/auth.middleware';
import validate from '@/shared/middleware/validateResource';
import { Role } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(protect);

/**
 * @route   GET /api/v1/companies/:companyId
 * @desc    Get company profile (name, logo, timezone)
 * @access  Authenticated users of the company
 */
router.get(
    '/:companyId',
    validate(CompanySchema.getCompanySchema),
    CompanyController.getCompanyProfile
);

/**
 * @route   PATCH /api/v1/companies/:companyId
 * @desc    Update settings (logo, currency, timezone)
 * @access  Org Admin
 */
router.patch(
    '/:companyId',
    restrictTo(Role.ORG_ADMIN, Role.SUPER_ADMIN),
    validate(CompanySchema.updateCompanySchema),
    CompanyController.updateCompanySettings
);

/**
 * @route   GET /api/v1/companies/:companyId/dashboard
 * @desc    Stats API. Get headcount, today's attendance stats, pending leaves
 * @access  HR Admin, Org Admin
 */
router.get(
    '/:companyId/dashboard',
    restrictTo(Role.HR_ADMIN, Role.ORG_ADMIN, Role.SUPER_ADMIN),
    validate(CompanySchema.getDashboardSchema),
    CompanyController.getDashboardStats
);

export default router;
