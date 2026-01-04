import { Router } from 'express';
import { Role } from '@prisma/client';
import * as OrganizationController from './organization.controller';
import { updateOrganizationSchema, auditLogQuerySchema, getOrganizationsQuerySchema } from './organization.schema';

// --- Cross-Module Imports ---
import * as CalendarController from '../calendars/calendars.controller';
import { createCalendarSchema } from '../calendars/calendars.schema';

import * as LeaveController from '../leaves/leaves.controller';
import { createLeaveGradeSchema } from '../leaves/leaves.schema';

import { protect, resolveTenant, restrictTo, validate } from '@/shared/middleware';

const router = Router();

// Global Middleware
router.use(protect);

// =========================================================================
// 1. NESTED RESOURCE ENTRY POINTS (Creation Only)
// =========================================================================

// --- Employees (Nested Create) ---
import * as MemberController from '../members';
import { createEmployeeSchema } from '../members';

// POST /api/v1/org/:organizationId/employees
router.post(
    '/:organizationId/members',
    resolveTenant,
    restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.SUPER_ADMIN),
    validate(createEmployeeSchema),
    MemberController.createUser
);

// GET /api/v1/org/:organizationId/members
router.get(
    '/:organizationId/members',
    resolveTenant,
    restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER, Role.SUPER_ADMIN, Role.EMPLOYEE),
    OrganizationController.getMembers
);

// --- Calendars (Nested Create) ---
// POST /api/v1/org/:organizationId/calendars
router.post(
    '/:organizationId/calendars',
    resolveTenant,
    restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.SUPER_ADMIN),
    validate(createCalendarSchema),
    CalendarController.createCalendar
);

// --- Leave Grades (Nested Create) ---
// POST /api/v1/org/:organizationId/leave-grades
router.post(
    '/:organizationId/leave-grades',
    resolveTenant,
    restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.SUPER_ADMIN),
    validate(createLeaveGradeSchema),
    LeaveController.createLeaveGrade
);

// --- Invitations (Nested Create) ---
import * as InvitationController from '../invitations/invitations.controller';
import { createInvitationSchema } from '../invitations/invitations.schema';

// POST /api/v1/org/:organizationId/invitations
router.post(
    '/:organizationId/invitations',
    resolveTenant,
    restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.SUPER_ADMIN),
    validate(createInvitationSchema),
    InvitationController.createInvitation
);

// GET /api/v1/org/:organizationId/invitations
router.get(
    '/:organizationId/invitations',
    resolveTenant,
    restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.SUPER_ADMIN),
    // validate(getInvitationsQuerySchema), // Add validation if needed
    InvitationController.getInvitations
);

// --- Allocations (Nested List/Create) ---
import * as AllocationController from '../allocations/allocations.controller';
import { createLeaveAllocationSchema, getAllocationsQuerySchema } from '../allocations/allocations.schema';

// GET /api/v1/org/:organizationId/allocations
router.get(
    '/:organizationId/allocations',
    resolveTenant,
    restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER, Role.SUPER_ADMIN),
    validate(getAllocationsQuerySchema),
    AllocationController.getAllocations
);

// POST /api/v1/org/:organizationId/allocations
router.post(
    '/:organizationId/allocations',
    resolveTenant,
    restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.SUPER_ADMIN),
    validate(createLeaveAllocationSchema),
    AllocationController.createEmployeeAllocation
);

// POST /api/v1/org/:organizationId/allocations/bulk
router.post(
    '/:organizationId/allocations/bulk',
    resolveTenant,
    restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.SUPER_ADMIN),
    // validate(bulkAllocateSchema), // Assuming schema exists
    AllocationController.bulkAllocate
);


// =========================================================================
// 2. ORGANIZATION MANAGEMENT ROUTES
// =========================================================================

// --- Attendance (Nested Manual Management) ---
import * as AttendanceController from '../attendance/attendance.controller';
import { manualEntrySchema, getAttendanceQuerySchema } from '../attendance/attendance.schema';

// GET /api/v1/org/:organizationId/attendance
router.get(
    '/:organizationId/attendance',
    resolveTenant,
    restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER, Role.SUPER_ADMIN),
    validate(getAttendanceQuerySchema),
    AttendanceController.getAllAttendance
);

// POST /api/v1/org/:organizationId/attendance
router.post(
    '/:organizationId/attendance',
    resolveTenant,
    restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER, Role.SUPER_ADMIN),
    validate(manualEntrySchema),
    AttendanceController.createAttendance
);

// PATCH /api/v1/org/:organizationId/attendance/:attendanceId
router.patch(
    '/:organizationId/attendance/:attendanceId',
    resolveTenant,
    restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER, Role.SUPER_ADMIN),
    // validate(manualEntrySchema.partial()), // Use partial schema if available, or just body
    AttendanceController.updateAttendance
);

/**
 * @route   GET /api/v1/org/:organizationId
 */
router.get(
    '/:organizationId',
    resolveTenant,
    restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.SUPER_ADMIN),
    OrganizationController.getOrganization
);

/**
 * @route   GET /api/v1/org
 */
router.get(
    '/',
    resolveTenant,
    restrictTo(Role.SUPER_ADMIN),
    validate(getOrganizationsQuerySchema),
    OrganizationController.getOrganizations
);

/**
 * @route   POST /api/v1/org
 */
router.post(
    '/',
    resolveTenant,
    restrictTo(Role.SUPER_ADMIN),
    OrganizationController.createOrganization
);

/**
 * @route   PATCH /api/v1/org/:organizationId
 */
router.patch(
    '/:organizationId',
    resolveTenant,
    restrictTo(Role.ORG_ADMIN, Role.SUPER_ADMIN),
    validate(updateOrganizationSchema),
    OrganizationController.updateOrganization
);

/**
 * @route   GET /api/v1/org/:organizationId/dashboard
 */
router.get(
    '/:organizationId/dashboard',
    resolveTenant,
    restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.SUPER_ADMIN),
    OrganizationController.getDashboardStats
);

/**
 * @route   GET /api/v1/org/:organizationId/audit-logs
 */
router.get(
    '/:organizationId/audit-logs',
    resolveTenant,
    restrictTo(Role.ORG_ADMIN, Role.SUPER_ADMIN),
    validate(auditLogQuerySchema),
    OrganizationController.getOrganizationAuditLogs
);

// =========================================================================
// MEMBER MANAGEMENT ROUTES (Restricted Strict RBAC)
// =========================================================================



// DELETE /api/v1/org/:organizationId/members/:employeeId
router.delete(
    '/:organizationId/members/:employeeId',
    resolveTenant,
    restrictTo(Role.ORG_ADMIN, Role.HR_ADMIN, Role.SUPER_ADMIN),
    OrganizationController.removeMember
);

export default router;