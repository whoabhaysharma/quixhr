import { Router } from 'express';
import * as MeController from './me.controller';
import { protect } from '@/shared/middleware/auth.middleware';
import validate from '@/common/middlewares/validate.middleware';
import {
  updateUserProfileSchema,
  checkInSchema,
  checkOutSchema,
  leaveRequestSchema,
} from './me.schema';

const router = Router();

// All routes in this module are protected (require authentication)
router.use(protect);

// =========================================================================
// PROFILE ENDPOINTS
// =========================================================================

/**
 * @route   GET /api/v1/me
 * @desc    Get my complete profile (user + employee + company info)
 * @access  Protected
 */
router.get('/', MeController.getProfile);

/**
 * @route   PATCH /api/v1/me
 * @desc    Update my profile (email, verification status)
 * @access  Protected
 */
router.patch('/', validate(updateUserProfileSchema), MeController.updateProfile);

// =========================================================================
// LEAVE ENDPOINTS - All scoped to current employee
// =========================================================================

/**
 * @route   GET /api/v1/me/leaves/policies
 * @desc    Get my leave policies (based on my leave grade)
 * @access  Protected
 */
router.get('/leaves/policies', MeController.getMyLeaves);

/**
 * @route   GET /api/v1/me/leaves/balance
 * @desc    Get my leave balance for the current year
 * @access  Protected
 * @query   ?year=2025 (optional, defaults to current year)
 */
router.get('/leaves/balance', MeController.getMyLeaveBalance);

/**
 * @route   GET /api/v1/me/leaves/ledger
 * @desc    Get my leave transaction history (ledger)
 * @access  Protected
 * @query   ?page=1&limit=20
 */
router.get('/leaves/ledger', MeController.getMyLeaveLedger);

/**
 * @route   GET /api/v1/me/leaves/requests
 * @desc    Get my leave requests with filter options
 * @access  Protected
 * @query   ?status=PENDING&page=1&limit=20
 */
router.get('/leaves/requests', MeController.getMyLeaveRequests);

/**
 * @route   POST /api/v1/me/leaves/requests
 * @desc    Create a new leave request
 * @access  Protected
 * @body    {
 *   startDate: ISO8601 string,
 *   endDate: ISO8601 string,
 *   type: "ANNUAL" | "SICK" | "CASUAL" | etc,
 *   reason?: string,
 *   dayDetails?: object
 * }
 */
router.post('/leaves/requests', validate(leaveRequestSchema), MeController.createLeaveRequest);

// =========================================================================
// ATTENDANCE ENDPOINTS - All scoped to current employee
// =========================================================================

/**
 * @route   GET /api/v1/me/attendance
 * @desc    Get my attendance records
 * @access  Protected
 * @query   ?page=1&limit=20
 */
router.get('/attendance', MeController.getMyAttendance);

/**
 * @route   POST /api/v1/me/attendance/check-in
 * @desc    Check in for today
 * @access  Protected
 * @body    {
 *   method?: "WEB" | "MOBILE" | "BIOMETRIC",
 *   gpsCoords?: { latitude: number, longitude: number }
 * }
 */
router.post('/attendance/check-in', validate(checkInSchema), MeController.checkIn);

/**
 * @route   POST /api/v1/me/attendance/check-out
 * @desc    Check out for today
 * @access  Protected
 * @body    {
 *   method?: "WEB" | "MOBILE" | "BIOMETRIC",
 *   gpsCoords?: { latitude: number, longitude: number }
 * }
 */
router.post('/attendance/check-out', validate(checkOutSchema), MeController.checkOut);

// =========================================================================
// NOTIFICATIONS ENDPOINTS - All scoped to current user
// =========================================================================

/**
 * @route   GET /api/v1/me/notifications
 * @desc    Get my notifications
 * @access  Protected
 * @query   ?page=1&limit=10
 */
router.get('/notifications', MeController.getNotifications);

/**
 * @route   PATCH /api/v1/me/notifications/:notificationId
 * @desc    Mark a notification as read
 * @access  Protected
 */
router.patch('/notifications/:notificationId', MeController.markNotificationAsRead);

// =========================================================================
// AUDIT LOG ENDPOINTS - All scoped to current user
// =========================================================================

/**
 * @route   GET /api/v1/me/audit-logs
 * @desc    Get my audit logs (activity history)
 * @access  Protected
 * @query   ?page=1&limit=10&action=LOGIN&resource=User
 */
router.get('/audit-logs', MeController.getAuditLogs);

export default router;
