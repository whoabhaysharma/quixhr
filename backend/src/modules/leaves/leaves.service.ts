import { prisma } from '@/utils/prisma';
import { AppError } from '@/utils/appError';
import { AuthContext, LeaveRequestCreateData, LeaveRequestUpdateData } from './leaves.types';
import { Role, LeaveStatus, LeaveType, LedgerEvent } from '@prisma/client';

/**
 * Leave Service Layer
 * Handles all business logic for leave management
 */
export class LeaveService {
  /**
   * Get all leave requests for a company with pagination and filtering
   */
  static async getLeaveRequests({
    authContext,
    companyId,
    page = 1,
    limit = 20,
    employeeId,
    status,
    type,
    startDate,
    endDate,
  }: {
    authContext: AuthContext;
    companyId: string;
    page?: number;
    limit?: number;
    employeeId?: string;
    status?: LeaveStatus;
    type?: LeaveType;
    startDate?: string;
    endDate?: string;
  }) {
    // Validate company access
    await this.validateCompanyAccess(authContext, companyId);

    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {
      employee: {
        companyId,
      },
    };

    // If user is not admin, only show their own requests
    if (!this.isAdmin(authContext.role) && authContext.employeeId) {
      whereClause.employeeId = authContext.employeeId;
    }

    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    if (status) {
      whereClause.status = status;
    }

    if (type) {
      whereClause.type = type;
    }

    if (startDate && endDate) {
      whereClause.AND = [
        {
          startDate: {
            gte: new Date(startDate),
          },
        },
        {
          endDate: {
            lte: new Date(endDate),
          },
        },
      ];
    }

    const [leaveRequests, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              user: {
                select: {
                  email: true,
                },
              },
            },
          },
        },
      }),
      prisma.leaveRequest.count({ where: whereClause }),
    ]);

    return {
      leaveRequests: leaveRequests.map((request) => ({
        id: request.id,
        employeeId: request.employeeId,
        employeeName: `${request.employee.firstName} ${request.employee.lastName}`,
        employeeEmail: request.employee.user?.email,
        startDate: request.startDate,
        endDate: request.endDate,
        daysTaken: request.daysTaken,
        type: request.type,
        status: request.status,
        reason: request.reason,
        dayDetails: request.dayDetails,
        approvedBy: request.approvedBy,
        createdAt: request.createdAt,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get leave request by ID
   */
  static async getLeaveRequestById({
    authContext,
    companyId,
    leaveRequestId,
  }: {
    authContext: AuthContext;
    companyId: string;
    leaveRequestId: string;
  }) {
    // Validate company access
    await this.validateCompanyAccess(authContext, companyId);

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: leaveRequestId },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyId: true,
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });

    if (!leaveRequest) {
      throw new AppError('Leave request not found', 404);
    }

    if (leaveRequest.employee.companyId !== companyId) {
      throw new AppError('Access denied. Leave request belongs to different company.', 403);
    }

    // Non-admin users can only view their own requests
    if (!this.isAdmin(authContext.role) && authContext.employeeId !== leaveRequest.employeeId) {
      throw new AppError('Access denied. You can only view your own leave requests.', 403);
    }

    // Get approver name if approved
    let approverName: string | undefined;
    if (leaveRequest.approvedBy) {
      const approver = await prisma.user.findUnique({
        where: { id: leaveRequest.approvedBy },
        select: {
          employee: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });
      approverName = approver?.employee 
        ? `${approver.employee.firstName} ${approver.employee.lastName}` 
        : undefined;
    }

    return {
      id: leaveRequest.id,
      employeeId: leaveRequest.employeeId,
      employeeName: `${leaveRequest.employee.firstName} ${leaveRequest.employee.lastName}`,
      employeeEmail: leaveRequest.employee.user?.email,
      startDate: leaveRequest.startDate,
      endDate: leaveRequest.endDate,
      daysTaken: leaveRequest.daysTaken,
      type: leaveRequest.type,
      status: leaveRequest.status,
      reason: leaveRequest.reason,
      dayDetails: leaveRequest.dayDetails,
      approvedBy: leaveRequest.approvedBy,
      approverName,
      createdAt: leaveRequest.createdAt,
    };
  }

  /**
   * Create a new leave request
   */
  static async createLeaveRequest({
    authContext,
    companyId,
    data,
  }: {
    authContext: AuthContext;
    companyId: string;
    data: LeaveRequestCreateData;
  }) {
    // Validate company access
    await this.validateCompanyAccess(authContext, companyId);

    // Get employee context
    const employee = await this.getEmployeeContext(authContext);

    if (employee.companyId !== companyId) {
      throw new AppError('Access denied. You do not belong to this company.', 403);
    }

    // Validate date range
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (startDate > endDate) {
      throw new AppError('Start date cannot be later than end date', 400);
    }

    // Calculate days taken (simplified calculation)
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const daysTaken = daysDiff;

    // Check leave balance
    await this.validateLeaveBalance(employee.id, data.type, daysTaken);

    // Check for overlapping requests
    await this.checkOverlappingRequests(employee.id, startDate, endDate);

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        employeeId: employee.id,
        startDate,
        endDate,
        daysTaken,
        type: data.type,
        status: LeaveStatus.PENDING,
        reason: data.reason,
        dayDetails: data.dayDetails,
      },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });

    return {
      id: leaveRequest.id,
      employeeId: leaveRequest.employeeId,
      employeeName: `${leaveRequest.employee.firstName} ${leaveRequest.employee.lastName}`,
      employeeEmail: leaveRequest.employee.user?.email,
      startDate: leaveRequest.startDate,
      endDate: leaveRequest.endDate,
      daysTaken: leaveRequest.daysTaken,
      type: leaveRequest.type,
      status: leaveRequest.status,
      reason: leaveRequest.reason,
      dayDetails: leaveRequest.dayDetails,
      approvedBy: leaveRequest.approvedBy,
      createdAt: leaveRequest.createdAt,
    };
  }

  /**
   * Update leave request status (approve/reject)
   */
  static async updateLeaveRequest({
    authContext,
    companyId,
    leaveRequestId,
    data,
  }: {
    authContext: AuthContext;
    companyId: string;
    leaveRequestId: string;
    data: LeaveRequestUpdateData;
  }) {
    // Validate permissions (only admins can update status)
    this.requireAdminPermissions(authContext.role);

    // Validate company access
    await this.validateCompanyAccess(authContext, companyId);

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: leaveRequestId },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyId: true,
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });

    if (!leaveRequest) {
      throw new AppError('Leave request not found', 404);
    }

    if (leaveRequest.employee.companyId !== companyId) {
      throw new AppError('Access denied. Leave request belongs to different company.', 403);
    }

    if (leaveRequest.status !== LeaveStatus.PENDING) {
      throw new AppError('Leave request has already been processed', 400);
    }

    // Get approver context
    const approver = await this.getEmployeeContext(authContext);

    const updatedRequest = await prisma.leaveRequest.update({
      where: { id: leaveRequestId },
      data: {
        status: data.status,
        reason: data.reason || leaveRequest.reason,
        approvedBy: approver.userId,
      },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });

    // If approved, deduct from leave balance
    if (data.status === LeaveStatus.APPROVED) {
      await this.deductLeaveBalance(
        leaveRequest.employeeId,
        leaveRequest.type,
        leaveRequest.daysTaken,
        leaveRequestId
      );
    }

    return {
      id: updatedRequest.id,
      employeeId: updatedRequest.employeeId,
      employeeName: `${updatedRequest.employee.firstName} ${updatedRequest.employee.lastName}`,
      employeeEmail: updatedRequest.employee.user?.email,
      startDate: updatedRequest.startDate,
      endDate: updatedRequest.endDate,
      daysTaken: updatedRequest.daysTaken,
      type: updatedRequest.type,
      status: updatedRequest.status,
      reason: updatedRequest.reason,
      dayDetails: updatedRequest.dayDetails,
      approvedBy: updatedRequest.approvedBy,
      createdAt: updatedRequest.createdAt,
    };
  }

  /**
   * Get employee leave balances
   */
  static async getLeaveBalances({
    authContext,
    companyId,
    employeeId,
    year = new Date().getFullYear(),
  }: {
    authContext: AuthContext;
    companyId: string;
    employeeId: string;
    year?: number;
  }) {
    // Validate company access
    await this.validateCompanyAccess(authContext, companyId);

    // Validate employee access
    await this.validateEmployeeAccess(authContext, companyId, employeeId);

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        companyId: true,
      },
    });

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    if (employee.companyId !== companyId) {
      throw new AppError('Access denied. Employee belongs to different company.', 403);
    }

    const balances = await prisma.leaveAllocation.findMany({
      where: {
        employeeId,
        year,
      },
    });

    return {
      employeeId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      year,
      balances: balances.map((balance) => ({
        leaveType: balance.leaveType,
        allocated: balance.allocated,
        used: balance.used,
        remaining: balance.allocated - balance.used,
      })),
    };
  }

  /**
   * Adjust employee leave balance manually
   */
  static async adjustLeaveBalance({
    authContext,
    companyId,
    employeeId,
    leaveType,
    amount,
    remarks,
  }: {
    authContext: AuthContext;
    companyId: string;
    employeeId: string;
    leaveType: LeaveType;
    amount: number;
    remarks: string;
  }) {
    // Validate permissions (only super admin can adjust balances)
    this.requireSuperAdminPermissions(authContext.role);

    // Validate company access
    await this.validateCompanyAccess(authContext, companyId);

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    if (employee.companyId !== companyId) {
      throw new AppError('Access denied. Employee belongs to different company.', 403);
    }

    const currentYear = new Date().getFullYear();

    // Update allocation
    const allocation = await prisma.leaveAllocation.upsert({
      where: {
        employeeId_year_leaveType: {
          employeeId,
          year: currentYear,
          leaveType,
        },
      },
      update: {
        allocated: {
          increment: amount,
        },
      },
      create: {
        employeeId,
        year: currentYear,
        leaveType,
        allocated: Math.max(0, amount),
        used: 0,
      },
    });

    // Create ledger entry
    await prisma.leaveLedger.create({
      data: {
        employeeId,
        event: LedgerEvent.ADJUSTMENT,
        amount,
        remarks,
      },
    });

    return {
      employeeId,
      leaveType,
      amount,
      newBalance: allocation.allocated - allocation.used,
      remarks,
    };
  }

  // =========================================================================
  // HELPER METHODS
  // =========================================================================

  /**
   * Validate company access for the user
   */
  private static async validateCompanyAccess(authContext: AuthContext, companyId: string) {
    // SUPER_ADMIN can access any company
    if (authContext.role === Role.SUPER_ADMIN) {
      return;
    }

    // For other roles, check if user belongs to the company
    if (authContext.companyId !== companyId) {
      throw new AppError('Access denied. You do not have permission to access this company.', 403);
    }
  }

  /**
   * Validate employee access (admins can access any employee, employees can only access themselves)
   */
  private static async validateEmployeeAccess(authContext: AuthContext, companyId: string, employeeId: string) {
    // Admins can access any employee in their company
    if (this.isAdmin(authContext.role)) {
      return;
    }

    // Regular employees can only access their own data
    if (authContext.employeeId !== employeeId) {
      throw new AppError('Access denied. You can only access your own data.', 403);
    }
  }

  /**
   * Check if user has admin permissions
   */
  private static isAdmin(role: Role): boolean {
    return [Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER].includes(role);
  }

  /**
   * Check if user has admin permissions
   */
  private static requireAdminPermissions(role: Role) {
    const adminRoles = [Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN, Role.MANAGER];
    if (!adminRoles.includes(role)) {
      throw new AppError('Insufficient permissions. Admin access required.', 403);
    }
  }

  /**
   * Check if user has super admin permissions
   */
  private static requireSuperAdminPermissions(role: Role) {
    if (role !== Role.SUPER_ADMIN) {
      throw new AppError('Insufficient permissions. Super Admin access required.', 403);
    }
  }

  /**
   * Get employee context from auth context
   */
  private static async getEmployeeContext(authContext: AuthContext) {
    if (!authContext.employeeId) {
      throw new AppError('Employee profile not found', 404);
    }

    const employee = await prisma.employee.findUnique({
      where: { id: authContext.employeeId },
    });

    if (!employee) {
      throw new AppError('Employee profile not found', 404);
    }

    return employee;
  }

  /**
   * Validate leave balance before creating request
   */
  private static async validateLeaveBalance(employeeId: string, leaveType: LeaveType, daysTaken: number) {
    const currentYear = new Date().getFullYear();
    
    const allocation = await prisma.leaveAllocation.findUnique({
      where: {
        employeeId_year_leaveType: {
          employeeId,
          year: currentYear,
          leaveType,
        },
      },
    });

    if (!allocation) {
      throw new AppError(`No leave allocation found for ${leaveType} in ${currentYear}`, 400);
    }

    const remaining = allocation.allocated - allocation.used;
    if (daysTaken > remaining) {
      throw new AppError(
        `Insufficient leave balance. You have ${remaining} days remaining for ${leaveType}`,
        400
      );
    }
  }

  /**
   * Check for overlapping leave requests
   */
  private static async checkOverlappingRequests(employeeId: string, startDate: Date, endDate: Date) {
    const overlapping = await prisma.leaveRequest.findFirst({
      where: {
        employeeId,
        status: {
          in: [LeaveStatus.PENDING, LeaveStatus.APPROVED],
        },
        OR: [
          {
            AND: [
              { startDate: { lte: startDate } },
              { endDate: { gte: startDate } },
            ],
          },
          {
            AND: [
              { startDate: { lte: endDate } },
              { endDate: { gte: endDate } },
            ],
          },
          {
            AND: [
              { startDate: { gte: startDate } },
              { endDate: { lte: endDate } },
            ],
          },
        ],
      },
    });

    if (overlapping) {
      throw new AppError('You have an overlapping leave request for these dates', 400);
    }
  }

  /**
   * Deduct leave balance when request is approved
   */
  private static async deductLeaveBalance(
    employeeId: string,
    leaveType: LeaveType,
    daysTaken: number,
    leaveRequestId: string
  ) {
    const currentYear = new Date().getFullYear();

    await prisma.leaveAllocation.update({
      where: {
        employeeId_year_leaveType: {
          employeeId,
          year: currentYear,
          leaveType,
        },
      },
      data: {
        used: {
          increment: daysTaken,
        },
      },
    });

    // Create ledger entry
    await prisma.leaveLedger.create({
      data: {
        employeeId,
        event: LedgerEvent.CONSUMPTION,
        amount: -daysTaken,
        remarks: `Leave consumed for request`,
        leaveRequestId,
      },
    });
  }
}