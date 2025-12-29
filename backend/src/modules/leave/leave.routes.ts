import { Router } from 'express';
import * as LeaveController from './leave.controller';
import * as LeaveSchema from './leave.schema';
import { protect, restrictTo } from '@/modules/auth/auth.middleware';
import { resolveTenant } from '@/shared/middleware/tenantContext';
import validate from '@/shared/middleware/validateResource';
import { Role } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(protect);

/**
 * @description  Get leave balances (Allocation vs Used vs Balance)
 * @route        GET /api/v1/leaves/my-balances
 * @access       Employee (any authenticated user)
 */
router.get(
    '/my-balances',
    LeaveController.getMyBalances
);

/**
 * @description  Apply for leave
 * @route        POST /api/v1/leaves/apply
 * @access       Employee (any authenticated user)
 */
router.post(
    '/apply',
    validate(LeaveSchema.applyLeaveSchema),
    LeaveController.applyLeave
);

/**
 * @description  Cancel leave request (triggers refund)
 * @route        PATCH /api/v1/leaves/requests/:id/cancel
 * @access       Employee (own requests only)
 */
router.patch(
    '/requests/:id/cancel',
    validate(LeaveSchema.cancelRequestSchema),
    LeaveController.cancelRequest
);

// Routes below require tenant resolution
router.use(resolveTenant);

/**
 * @description  List leave requests
 * @route        GET /api/v1/leaves/requests
 * @access       All (Employee sees own, Manager sees team, HR sees company)
 * @note         SUPER_ADMIN can filter by ?companyId=xxx
 */
router.get(
    '/requests',
    validate(LeaveSchema.listRequestsSchema),
    LeaveController.listRequests
);

/**
 * @description  Approve or reject leave request
 * @route        PATCH /api/v1/leaves/requests/:id
 * @access       Manager
 */
router.patch(
    '/requests/:id',
    restrictTo(Role.MANAGER, Role.HR_ADMIN, Role.ORG_ADMIN, Role.SUPER_ADMIN),
    validate(LeaveSchema.approveRejectSchema),
    LeaveController.approveRejectRequest
);

/**
 * @description  Get leave ledger (audit trail)
 * @route        GET /api/v1/leaves/ledger/:employeeId
 * @access       HR/User (User can see own ledger)
 */
router.get(
    '/ledger/:employeeId',
    validate(LeaveSchema.getLedgerSchema),
    LeaveController.getLeaveLedger
);

/**
 * @description  Manual leave adjustment (Fix errors/Add bonus)
 * @route        POST /api/v1/leaves/adjust
 * @access       HR Admin
 */
router.post(
    '/adjust',
    restrictTo(Role.HR_ADMIN, Role.ORG_ADMIN, Role.SUPER_ADMIN),
    validate(LeaveSchema.adjustLeaveSchema),
    LeaveController.adjustLeave
);

/**
 * @description  Bulk import leave balances from CSV
 * @route        POST /api/v1/leaves/import
 * @access       HR Admin
 */
router.post(
    '/import',
    restrictTo(Role.HR_ADMIN, Role.ORG_ADMIN, Role.SUPER_ADMIN),
    validate(LeaveSchema.importLeavesSchema),
    LeaveController.importLeaves
);

export default router;
