import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';
import { LeaveService } from './leaves.service';
import { AuthContext } from './leaves.types';
import { AppError } from '@/utils/appError';
import {
  LeaveRequestResponseDto,
  LeaveRequestsListResponseDto,
  LeaveBalancesResponseDto,
  LeaveAdjustmentResponseDto,
} from './leaves.schema';

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
  return user as AuthContext;
};

// =========================================================================
// LEAVE REQUEST ENDPOINTS
// =========================================================================

/**
 * @desc    Get all leave requests for a company
 * @route   GET /api/v1/companies/:companyId/leaves
 * @access  Protected (ORG_ADMIN, HR_ADMIN, MANAGER, SUPER_ADMIN for all; EMPLOYEE for own)
 */
export const getLeaveRequests = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authContext = getAuthContext(req);
    const { companyId } = req.params;
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const employeeId = req.query.employeeId as string;
    const status = req.query.status as any;
    const type = req.query.type as any;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const result = await LeaveService.getLeaveRequests({
      authContext,
      companyId,
      page,
      limit,
      employeeId,
      status,
      type,
      startDate,
      endDate,
    });

    const responseData: LeaveRequestsListResponseDto = {
      success: true,
      message: 'Leave requests retrieved successfully',
      data: {
        leaveRequests: result.leaveRequests,
        pagination: result.pagination,
      },
    };

    sendResponse(res, 200, responseData);
  }
);

/**
 * @desc    Get leave request details by ID
 * @route   GET /api/v1/companies/:companyId/leaves/:leaveRequestId
 * @access  Protected (ORG_ADMIN, HR_ADMIN, MANAGER, SUPER_ADMIN, or own request)
 */
export const getLeaveRequestById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authContext = getAuthContext(req);
    const { companyId, leaveRequestId } = req.params;

    const leaveRequest = await LeaveService.getLeaveRequestById({
      authContext,
      companyId,
      leaveRequestId,
    });

    const responseData: LeaveRequestResponseDto = {
      success: true,
      message: 'Leave request details retrieved successfully',
      data: leaveRequest,
    };

    sendResponse(res, 200, responseData);
  }
);

/**
 * @desc    Create a new leave request
 * @route   POST /api/v1/companies/:companyId/leaves
 * @access  Protected (All authenticated employees)
 */
export const createLeaveRequest = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authContext = getAuthContext(req);
    const { companyId } = req.params;
    
    const leaveRequest = await LeaveService.createLeaveRequest({
      authContext,
      companyId,
      data: req.body,
    });

    const responseData: LeaveRequestResponseDto = {
      success: true,
      message: 'Leave request created successfully',
      data: leaveRequest,
    };

    sendResponse(res, 201, responseData);
  }
);

/**
 * @desc    Update leave request status (approve/reject)
 * @route   PATCH /api/v1/companies/:companyId/leaves/:leaveRequestId
 * @access  Protected (ORG_ADMIN, HR_ADMIN, MANAGER, SUPER_ADMIN)
 */
export const updateLeaveRequest = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authContext = getAuthContext(req);
    const { companyId, leaveRequestId } = req.params;

    const leaveRequest = await LeaveService.updateLeaveRequest({
      authContext,
      companyId,
      leaveRequestId,
      data: req.body,
    });

    const responseData: LeaveRequestResponseDto = {
      success: true,
      message: 'Leave request updated successfully',
      data: leaveRequest,
    };

    sendResponse(res, 200, responseData);
  }
);

// =========================================================================
// LEAVE BALANCE ENDPOINTS
// =========================================================================

/**
 * @desc    Get employee leave balances
 * @route   GET /api/v1/companies/:companyId/leaves/balances/:employeeId
 * @access  Protected (ORG_ADMIN, HR_ADMIN, MANAGER, SUPER_ADMIN, or own balance)
 */
export const getLeaveBalances = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authContext = getAuthContext(req);
    const { companyId, employeeId } = req.params;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();

    const balances = await LeaveService.getLeaveBalances({
      authContext,
      companyId,
      employeeId,
      year,
    });

    const responseData: LeaveBalancesResponseDto = {
      success: true,
      message: 'Leave balances retrieved successfully',
      data: balances,
    };

    sendResponse(res, 200, responseData);
  }
);

/**
 * @desc    Manually adjust employee leave balance
 * @route   POST /api/v1/companies/:companyId/leaves/adjust/:employeeId
 * @access  Protected (SUPER_ADMIN only)
 */
export const adjustLeaveBalance = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authContext = getAuthContext(req);
    const { companyId, employeeId } = req.params;
    const { leaveType, amount, remarks } = req.body;

    const adjustment = await LeaveService.adjustLeaveBalance({
      authContext,
      companyId,
      employeeId,
      leaveType,
      amount,
      remarks,
    });

    const responseData: LeaveAdjustmentResponseDto = {
      success: true,
      message: 'Leave balance adjusted successfully',
      data: adjustment,
    };

    sendResponse(res, 200, responseData);
  }
);