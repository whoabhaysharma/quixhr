import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/utils/prisma';
import { AppError } from '@/utils/appError';
import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';
import { AuthContext, EmployeeContext } from './me.types';
import {
  CompleteProfileResponseDto,
  UserProfileResponseDto,
  EmployeeProfileResponseDto,
  CompanyProfileResponseDto,
  UpdateUserProfileRequestDto,
  CheckInRequestDto,
  CheckOutRequestDto,
  NotificationsListResponseDto,
  AuditLogsListResponseDto,
  MyLeavesResponseDto,
  MyLeaveBalanceResponseDto,
  MyLeaveLedgerResponseDto,
  MyLeaveRequestsResponseDto,
  MyAttendanceResponseDto,
  CheckInOutResponseDto,
} from './me.schema';

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

/**
 * Get employee context for the authenticated user
 */
const getEmployeeContext = async (userId: string): Promise<EmployeeContext> => {
  const employee = await prisma.employee.findUnique({
    where: { userId },
  });

  if (!employee) {
    throw new AppError('Employee profile not found', 404);
  }

  return {
    id: employee.id,
    companyId: employee.companyId,
    userId: employee.userId || '',
    firstName: employee.firstName,
    lastName: employee.lastName,
    leaveGradeId: employee.leaveGradeId || undefined,
    calendarId: employee.calendarId || undefined,
  };
};

/**
 * Build complete profile response
 */
const buildCompleteProfileResponse = async (
  userId: string
): Promise<CompleteProfileResponseDto> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const employee = await prisma.employee.findUnique({
    where: { userId },
  });

  let company: CompanyProfileResponseDto | undefined;
  if (employee) {
    const companyData = await prisma.company.findUnique({
      where: { id: employee.companyId },
    });

    if (companyData) {
      company = {
        id: companyData.id,
        name: companyData.name,
        timezone: companyData.timezone,
        currency: companyData.currency,
        dateFormat: companyData.dateFormat,
        logoUrl: companyData.logoUrl || undefined,
        createdAt: companyData.createdAt,
      };
    }
  }

  const userProfile: UserProfileResponseDto = {
    id: user.id,
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    createdAt: new Date(),
  };

  const employeeProfile: EmployeeProfileResponseDto | undefined = employee
    ? {
        id: employee.id,
        companyId: employee.companyId,
        userId: employee.userId || '',
        firstName: employee.firstName,
        lastName: employee.lastName,
        code: employee.code || undefined,
        status: employee.status,
        joiningDate: employee.joiningDate,
        calendarId: employee.calendarId || undefined,
        leaveGradeId: employee.leaveGradeId || undefined,
      }
    : undefined;

  return {
    user: userProfile,
    employee: employeeProfile,
    company,
  };
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
    const profile = await buildCompleteProfileResponse(authContext.userId);
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

    const user = await prisma.user.findUnique({
      where: { id: authContext.userId },
    });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // If email is being updated, check for duplicates
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: updateData.email },
      });

      if (existingUser) {
        return next(new AppError('Email already in use', 400));
      }
    }

    await prisma.user.update({
      where: { id: authContext.userId },
      data: updateData,
    });

    const profile = await buildCompleteProfileResponse(authContext.userId);
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
    const employee = await getEmployeeContext(authContext.userId);

    if (!employee.leaveGradeId) {
      return next(new AppError('Employee has no leave grade assigned', 404));
    }

    const grade = await prisma.leaveGrade.findUnique({
      where: { id: employee.leaveGradeId },
      include: {
        policies: true,
      },
    });

    if (!grade) {
      return next(new AppError('Leave grade not found', 404));
    }

    const response: MyLeavesResponseDto = {
      gradeId: grade.id,
      gradeName: grade.name,
      policies: grade.policies.map((policy) => ({
        id: policy.id,
        leaveType: policy.leaveType,
        totalDays: policy.totalDays,
        carryForward: policy.carryForward,
        maxCarryAmount: policy.maxCarryAmount,
      })),
    };

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
    const employee = await getEmployeeContext(authContext.userId);
    const currentYear = new Date().getFullYear();

    const allocations = await prisma.leaveAllocation.findMany({
      where: {
        employeeId: employee.id,
        year: currentYear,
      },
    });

    const response: MyLeaveBalanceResponseDto = {
      year: currentYear,
      allocations: allocations.map((alloc) => ({
        id: alloc.id,
        year: alloc.year,
        leaveType: alloc.leaveType,
        allocated: alloc.allocated,
        used: alloc.used,
        remaining: alloc.allocated - alloc.used,
      })),
      total: allocations.length,
    };

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
    const employee = await getEmployeeContext(authContext.userId);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      prisma.leaveLedger.findMany({
        where: { employeeId: employee.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.leaveLedger.count({
        where: { employeeId: employee.id },
      }),
    ]);

    const response: MyLeaveLedgerResponseDto = {
      entries: entries.map((entry) => ({
        id: entry.id,
        createdAt: entry.createdAt,
        event: entry.event,
        amount: entry.amount,
        remarks: entry.remarks || undefined,
        leaveRequestId: entry.leaveRequestId || undefined,
      })),
      total,
    };

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
    const employee = await getEmployeeContext(authContext.userId);
    const status = (req.query.status as string) || undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      employeeId: employee.id,
    };

    if (status) whereClause.status = status;

    const [requests, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.leaveRequest.count({ where: whereClause }),
    ]);

    const response: MyLeaveRequestsResponseDto = {
      requests: requests.map((req) => ({
        id: req.id,
        startDate: req.startDate,
        endDate: req.endDate,
        daysTaken: req.daysTaken,
        type: req.type,
        status: req.status,
        reason: req.reason || undefined,
        dayDetails: req.dayDetails || undefined,
        approvedBy: req.approvedBy || undefined,
        createdAt: req.createdAt,
      })),
      total,
    };

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
    const employee = await getEmployeeContext(authContext.userId);
    const { startDate, endDate, type, reason, dayDetails } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return next(new AppError('Start date must be before end date', 400));
    }

    const daysTaken = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        employeeId: employee.id,
        startDate: start,
        endDate: end,
        daysTaken,
        type,
        status: 'PENDING',
        reason,
        dayDetails,
      },
    });

    const response = {
      id: leaveRequest.id,
      startDate: leaveRequest.startDate,
      endDate: leaveRequest.endDate,
      daysTaken: leaveRequest.daysTaken,
      type: leaveRequest.type,
      status: leaveRequest.status,
      reason: leaveRequest.reason || undefined,
      dayDetails: leaveRequest.dayDetails || undefined,
      approvedBy: leaveRequest.approvedBy || undefined,
      createdAt: leaveRequest.createdAt,
    };

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
    const employee = await getEmployeeContext(authContext.userId);
    const checkInData: CheckInRequestDto = req.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let attendance = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: employee.id,
          date: today,
        },
      },
    });

    const checkInTime = new Date();

    if (!attendance) {
      // Create new attendance record
      attendance = await prisma.attendance.create({
        data: {
          employeeId: employee.id,
          date: today,
          status: 'PRESENT',
          checkIn: checkInTime,
        },
      });
    } else {
      // Update existing attendance
      attendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          checkIn: checkInTime,
          status: 'PRESENT',
        },
      });
    }

    // Create attendance log
    await prisma.attendanceLog.create({
      data: {
        attendanceId: attendance.id,
        timestamp: checkInTime,
        type: 'IN',
        method: checkInData.method,
        gpsCoords: checkInData.gpsCoords,
      },
    });

    const response: CheckInOutResponseDto = {
      id: attendance.id,
      date: attendance.date,
      status: attendance.status as any,
      checkIn: attendance.checkIn || undefined,
      checkOut: attendance.checkOut || undefined,
      workMinutes: attendance.workMinutes,
      isLate: attendance.isLate,
    };

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
    const employee = await getEmployeeContext(authContext.userId);
    const checkOutData: CheckOutRequestDto = req.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: employee.id,
          date: today,
        },
      },
    });

    if (!attendance) {
      return next(new AppError('No check-in found for today. Please check in first.', 400));
    }

    const checkOutTime = new Date();

    // Calculate work minutes
    const checkInTime = attendance.checkIn;
    let workMinutes = 0;

    if (checkInTime) {
      workMinutes = Math.floor((checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60));
    }

    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOut: checkOutTime,
        workMinutes,
      },
    });

    // Create checkout log
    await prisma.attendanceLog.create({
      data: {
        attendanceId: attendance.id,
        timestamp: checkOutTime,
        type: 'OUT',
        method: checkOutData.method,
        gpsCoords: checkOutData.gpsCoords,
      },
    });

    const response: CheckInOutResponseDto = {
      id: updatedAttendance.id,
      date: updatedAttendance.date,
      status: updatedAttendance.status as any,
      checkIn: updatedAttendance.checkIn || undefined,
      checkOut: updatedAttendance.checkOut || undefined,
      workMinutes: updatedAttendance.workMinutes,
      isLate: updatedAttendance.isLate,
    };

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
    const employee = await getEmployeeContext(authContext.userId);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      prisma.attendance.findMany({
        where: { employeeId: employee.id },
        skip,
        take: limit,
        orderBy: { date: 'desc' },
      }),
      prisma.attendance.count({
        where: { employeeId: employee.id },
      }),
    ]);

    const response: MyAttendanceResponseDto = {
      records: records.map((record) => ({
        id: record.id,
        date: record.date,
        status: record.status as any,
        checkIn: record.checkIn || undefined,
        checkOut: record.checkOut || undefined,
        workMinutes: record.workMinutes,
        overtimeMins: record.overtimeMins,
        isLate: record.isLate,
        isEarlyOut: record.isEarlyOut,
      })),
      total,
    };

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
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: authContext.userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({
        where: { userId: authContext.userId },
      }),
    ]);

    const unreadCount = await prisma.notification.count({
      where: {
        userId: authContext.userId,
        isRead: false,
      },
    });

    const response: NotificationsListResponseDto = {
      notifications: notifications.map((n) => ({
        id: n.id,
        userId: n.userId,
        title: n.title,
        message: n.message,
        isRead: n.isRead,
        createdAt: n.createdAt,
      })),
      total,
      unreadCount,
    };

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

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return next(new AppError('Notification not found', 404));
    }

    if (notification.userId !== authContext.userId) {
      return next(new AppError('Not authorized to update this notification', 403));
    }

    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

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

    const skip = (page - 1) * limit;

    const whereClause: any = {
      userId: authContext.userId,
    };

    if (action) whereClause.action = { contains: action, mode: 'insensitive' };
    if (resource) whereClause.resource = { contains: resource, mode: 'insensitive' };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({
        where: whereClause,
      }),
    ]);

    const response: AuditLogsListResponseDto = {
      logs: logs.map((log) => ({
        id: log.id,
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId,
        details: log.details,
        ipAddress: log.ipAddress || undefined,
        createdAt: log.createdAt,
      })),
      total,
    };

    sendResponse(res, 200, response, 'Audit logs retrieved successfully');
  }
);
