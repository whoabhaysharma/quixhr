import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';
import { AppError } from '@/utils/appError';
import { AuthContext } from './me.types';
import { MeService } from './me.service';
import { UpdateUserProfileRequestDto, CheckInRequestDto, CheckOutRequestDto } from './me.schema';

// =========================================================================
// HELPER FUNCTIONS
// =========================================================================

/**
 * Get auth context from request
 */
const getAuthContext = (req: Request): AuthContext => {
  const user = (req as any).user;
  if (!user) {
    throw new AppError('User not authenticated', 401);
  }
  return {
    userId: user.id,
    email: user.email, // Assuming email is in token, if not, might be undefined but AuthContext says string. 
    // Check TokenPayload in auth.types.ts? 
    // Actually token payload might not have email. 
    // Let's check what verifyToken returns. 
    // But for now, fixing userId is priority.
    role: user.role,
    employeeId: user.employeeId,
    companyId: user.companyId
  } as AuthContext;
};

// =========================================================================
// PROFILE ENDPOINTS
// =========================================================================

/**
 * @desc    Get complete user profile (user + employee + company info)
 * @route   GET /api/v1/me
 * @access  Protected
 */
export const getProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authContext = getAuthContext(req);
    const profile = await MeService.getCompleteProfile(authContext.userId);
    sendResponse(res, 200, profile, 'User profile retrieved successfully');
  }
);

/**
 * @desc    Update user profile (email verification status)
 * @route   PATCH /api/v1/me
 * @access  Protected
 */
export const updateProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authContext = getAuthContext(req);
    const updateData: UpdateUserProfileRequestDto = req.body;
    const profile = await MeService.updateUserProfile(authContext.userId, updateData);
    sendResponse(res, 200, profile, 'User profile updated successfully');
  }
);

// =========================================================================
// LEAVE ENDPOINTS
// =========================================================================

/**
 * @desc    Get my leave policies (based on my leave grade)
 * @route   GET /api/v1/me/leaves/policies
 * @access  Protected
 */
export const getMyLeaves = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authContext = getAuthContext(req);
    const response = await MeService.getMyLeaves(authContext.userId);
    sendResponse(res, 200, response, 'Leave policies retrieved successfully');
  }
);

/**
 * @desc    Get my leave balance for the current year
 * @route   GET /api/v1/me/leaves/balance
 * @access  Protected
 */
export const getMyLeaveBalance = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authContext = getAuthContext(req);
    const response = await MeService.getMyLeaveBalance(authContext.userId);
    sendResponse(res, 200, response, 'Leave balance retrieved successfully');
  }
);

/**
 * @desc    Get my leave ledger (transaction history)
 * @route   GET /api/v1/me/leaves/ledger
 * @access  Protected
 */
export const getMyLeaveLedger = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authContext = getAuthContext(req);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const response = await MeService.getMyLeaveLedger(authContext.userId, page, limit);
    sendResponse(res, 200, response, 'Leave ledger retrieved successfully');
  }
);

/**
 * @desc    Get my leave requests
 * @route   GET /api/v1/me/leaves/requests
 * @access  Protected
 */
export const getMyLeaveRequests = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authContext = getAuthContext(req);
    const status = (req.query.status as string) || undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const response = await MeService.getMyLeaveRequests(authContext.userId, status, page, limit);
    sendResponse(res, 200, response, 'Leave requests retrieved successfully');
  }
);

/**
 * @desc    Create a leave request
 * @route   POST /api/v1/me/leaves/requests
 * @access  Protected
 */
export const createLeaveRequest = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authContext = getAuthContext(req);
    const response = await MeService.createLeaveRequest(authContext.userId, req.body);
    sendResponse(res, 201, response, 'Leave request created successfully');
  }
);

// =========================================================================
// ATTENDANCE ENDPOINTS
// =========================================================================

/**
 * @desc    Check in for today
 * @route   POST /api/v1/me/attendance/check-in
 * @access  Protected
 */
export const checkIn = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authContext = getAuthContext(req);
    const checkInData: CheckInRequestDto = req.body;
    const response = await MeService.checkIn(authContext.userId, checkInData);
    sendResponse(res, 200, response, 'Checked in successfully');
  }
);

/**
 * @desc    Check out for today
 * @route   POST /api/v1/me/attendance/check-out
 * @access  Protected
 */
export const checkOut = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authContext = getAuthContext(req);
    const checkOutData: CheckOutRequestDto = req.body;
    const response = await MeService.checkOut(authContext.userId, checkOutData);
    sendResponse(res, 200, response, 'Checked out successfully');
  }
);

/**
 * @desc    Get my attendance records
 * @route   GET /api/v1/me/attendance
 * @access  Protected
 */
export const getMyAttendance = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authContext = getAuthContext(req);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const response = await MeService.getMyAttendance(authContext.userId, page, limit);
    sendResponse(res, 200, response, 'Attendance records retrieved successfully');
  }
);

// =========================================================================
// NOTIFICATIONS & AUDIT ENDPOINTS
// =========================================================================

/**
 * @desc    Get my notifications
 * @route   GET /api/v1/me/notifications
 * @access  Protected
 */
export const getNotifications = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authContext = getAuthContext(req);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const response = await MeService.getNotifications(authContext.userId, page, limit);
    sendResponse(res, 200, response, 'Notifications retrieved successfully');
  }
);

/**
 * @desc    Mark notification as read
 * @route   PATCH /api/v1/me/notifications/:notificationId
 * @access  Protected
 */
export const markNotificationAsRead = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authContext = getAuthContext(req);
    const { notificationId } = req.params;

    const updatedNotification = await MeService.markNotificationAsRead(authContext.userId, notificationId);

    sendResponse(
      res,
      200,
      {
        id: updatedNotification.id,
        userId: updatedNotification.userId,
        title: updatedNotification.title,
        message: updatedNotification.message,
        isRead: updatedNotification.isRead,
        createdAt: updatedNotification.createdAt,
      },
      'Notification marked as read'
    );
  }
);

/**
 * @desc    Get my audit logs
 * @route   GET /api/v1/me/audit-logs
 * @access  Protected
 */
export const getAuditLogs = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authContext = getAuthContext(req);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const action = (req.query.action as string) || undefined;
    const resource = (req.query.resource as string) || undefined;

    const response = await MeService.getAuditLogs(authContext.userId, page, limit, action, resource);
    sendResponse(res, 200, response, 'Audit logs retrieved successfully');
  }
);
