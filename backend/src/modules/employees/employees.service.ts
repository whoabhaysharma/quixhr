import { prisma } from '@/utils/prisma';
import { AppError } from '@/utils/appError';
import { getQueryOptions } from '@/utils/apiFeatures';
import { AuthContext, EmployeeFilters, EmployeeCreateData, EmployeeUpdateData } from './employees.types';
import { Role } from '@prisma/client';

/**
 * Employee Service Layer
 * Handles all business logic for employee management
 */
export class EmployeeService {
  /**
   * Get all employees for a company with pagination and filtering
   */
  static async getEmployees({
    authContext,
    companyId,
    page = 1,
    limit = 20,
    search,
    status,
    calendarId,
    leaveGradeId,
  }: {
    authContext: AuthContext;
    companyId: string;
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    calendarId?: string;
    leaveGradeId?: string;
  }) {
    // Validate company access
    await this.validateCompanyAccess(authContext, companyId);

    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {
      companyId,
    };

    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) whereClause.status = status;
    if (calendarId) whereClause.calendarId = calendarId;
    if (leaveGradeId) whereClause.leaveGradeId = leaveGradeId;

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: [
          { firstName: 'asc' },
          { lastName: 'asc' },
        ],
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              isEmailVerified: true,
            },
          },
          calendar: {
            select: {
              id: true,
              name: true,
            },
          },
          leaveGrade: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.employee.count({ where: whereClause }),
    ]);

    return {
      employees: employees.map((employee) => ({
        id: employee.id,
        companyId: employee.companyId,
        firstName: employee.firstName,
        lastName: employee.lastName,
        fullName: `${employee.firstName} ${employee.lastName}`,
        code: employee.code,
        status: employee.status,
        joiningDate: employee.joiningDate,
        email: employee.user?.email,
        role: employee.user?.role,
        calendar: employee.calendar,
        leaveGrade: employee.leaveGrade,
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
   * Get employee by ID with detailed information
   */
  static async getEmployeeById({
    authContext,
    companyId,
    employeeId,
  }: {
    authContext: AuthContext;
    companyId: string;
    employeeId: string;
  }) {
    // Validate company access
    await this.validateCompanyAccess(authContext, companyId);

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isEmailVerified: true,
          },
        },
        calendar: {
          select: {
            id: true,
            name: true,
            dayStartTime: true,
            dayEndTime: true,
          },
        },
        leaveGrade: {
          select: {
            id: true,
            name: true,
            policies: {
              select: {
                leaveType: true,
                totalDays: true,
                carryForward: true,
              },
            },
          },
        },
      },
    });

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    if (employee.companyId !== companyId) {
      throw new AppError('Access denied. Employee belongs to different company.', 403);
    }

    return {
      id: employee.id,
      companyId: employee.companyId,
      firstName: employee.firstName,
      lastName: employee.lastName,
      fullName: `${employee.firstName} ${employee.lastName}`,
      code: employee.code,
      status: employee.status,
      joiningDate: employee.joiningDate,
      user: employee.user,
      calendar: employee.calendar,
      leaveGrade: employee.leaveGrade,
    };
  }

  /**
   * Create a new employee
   */
  static async createEmployee({
    authContext,
    companyId,
    data,
  }: {
    authContext: AuthContext;
    companyId: string;
    data: EmployeeCreateData;
  }) {
    // Validate permissions (only admins can create employees)
    this.requireAdminPermissions(authContext.role);

    // Validate company access
    await this.validateCompanyAccess(authContext, companyId);

    // Check if employee code is unique within company
    if (data.code) {
      const existingEmployee = await prisma.employee.findFirst({
        where: {
          companyId,
          code: data.code,
        },
      });

      if (existingEmployee) {
        throw new AppError('Employee code already exists in this company', 400);
      }
    }

    // Validate calendar and leave grade belong to the company
    await this.validateResourcesAccess(companyId, data.calendarId, data.leaveGradeId);

    let userId: string | undefined;

    // Create user account if email is provided
    if (data.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        // Check if user already has an employee profile
        const existingEmployee = await prisma.employee.findUnique({
          where: { userId: existingUser.id },
        });

        if (existingEmployee) {
          throw new AppError('User already has an employee profile', 400);
        }

        userId = existingUser.id;
      } else {
        // Create new user
        const user = await prisma.user.create({
          data: {
            email: data.email,
            password: 'temporary-password', // User will reset on first login
            role: data.role || Role.EMPLOYEE,
            isEmailVerified: false,
          },
        });

        userId = user.id;
      }
    }

    const employee = await prisma.employee.create({
      data: {
        companyId,
        userId,
        firstName: data.firstName,
        lastName: data.lastName,
        code: data.code,
        status: data.status,
        joiningDate: new Date(data.joiningDate),
        calendarId: data.calendarId,
        leaveGradeId: data.leaveGradeId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isEmailVerified: true,
          },
        },
        calendar: {
          select: {
            id: true,
            name: true,
          },
        },
        leaveGrade: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      id: employee.id,
      companyId: employee.companyId,
      firstName: employee.firstName,
      lastName: employee.lastName,
      fullName: `${employee.firstName} ${employee.lastName}`,
      code: employee.code,
      status: employee.status,
      joiningDate: employee.joiningDate,
      email: employee.user?.email,
      role: employee.user?.role,
      calendar: employee.calendar,
      leaveGrade: employee.leaveGrade,
    };
  }

  /**
   * Update an employee
   */
  static async updateEmployee({
    authContext,
    companyId,
    employeeId,
    data,
  }: {
    authContext: AuthContext;
    companyId: string;
    employeeId: string;
    data: EmployeeUpdateData;
  }) {
    // Validate permissions
    this.requireAdminPermissions(authContext.role);

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

    // Check if new employee code is unique
    if (data.code && data.code !== employee.code) {
      const existingEmployee = await prisma.employee.findFirst({
        where: {
          companyId,
          code: data.code,
          id: { not: employeeId },
        },
      });

      if (existingEmployee) {
        throw new AppError('Employee code already exists in this company', 400);
      }
    }

    // Validate calendar and leave grade belong to the company
    await this.validateResourcesAccess(companyId, data.calendarId, data.leaveGradeId);

    const updateData: any = { ...data };
    if (updateData.joiningDate) {
      updateData.joiningDate = new Date(updateData.joiningDate);
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id: employeeId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isEmailVerified: true,
          },
        },
        calendar: {
          select: {
            id: true,
            name: true,
          },
        },
        leaveGrade: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      id: updatedEmployee.id,
      companyId: updatedEmployee.companyId,
      firstName: updatedEmployee.firstName,
      lastName: updatedEmployee.lastName,
      fullName: `${updatedEmployee.firstName} ${updatedEmployee.lastName}`,
      code: updatedEmployee.code,
      status: updatedEmployee.status,
      joiningDate: updatedEmployee.joiningDate,
      email: updatedEmployee.user?.email,
      role: updatedEmployee.user?.role,
      calendar: updatedEmployee.calendar,
      leaveGrade: updatedEmployee.leaveGrade,
    };
  }

  /**
   * Delete an employee
   */
  static async deleteEmployee({
    authContext,
    companyId,
    employeeId,
  }: {
    authContext: AuthContext;
    companyId: string;
    employeeId: string;
  }) {
    // Validate permissions (only super admin and org admin can delete employees)
    this.requireSuperAdminPermissions(authContext.role);

    // Validate company access
    await this.validateCompanyAccess(authContext, companyId);

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        attendance: true,
        leaveRequests: true,
        leaveAllocations: true,
        leaveLedger: true,
      },
    });

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    if (employee.companyId !== companyId) {
      throw new AppError('Access denied. Employee belongs to different company.', 403);
    }

    // Check if employee has related data that prevents deletion
    const hasAttendance = employee.attendance.length > 0;
    const hasLeaveRequests = employee.leaveRequests.length > 0;
    const hasLeaveData = employee.leaveAllocations.length > 0 || employee.leaveLedger.length > 0;

    if (hasAttendance || hasLeaveRequests || hasLeaveData) {
      throw new AppError(
        'Cannot delete employee. Employee has attendance records, leave requests, or leave data. Consider deactivating the employee instead.',
        400
      );
    }

    await prisma.employee.delete({
      where: { id: employeeId },
    });

    return { message: 'Employee deleted successfully' };
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
   * Check if user has admin permissions
   */
  private static requireAdminPermissions(role: Role) {
    const adminRoles: Role[] = [Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN];
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
   * Validate that calendar and leave grade belong to the company
   */
  private static async validateResourcesAccess(
    companyId: string,
    calendarId?: string,
    leaveGradeId?: string
  ) {
    if (calendarId) {
      const calendar = await prisma.calendar.findUnique({
        where: { id: calendarId },
      });

      if (!calendar || calendar.companyId !== companyId) {
        throw new AppError('Invalid calendar. Calendar does not belong to this company.', 400);
      }
    }

    if (leaveGradeId) {
      const leaveGrade = await prisma.leaveGrade.findUnique({
        where: { id: leaveGradeId },
      });

      if (!leaveGrade || leaveGrade.companyId !== companyId) {
        throw new AppError('Invalid leave grade. Leave grade does not belong to this company.', 400);
      }
    }
  }
}