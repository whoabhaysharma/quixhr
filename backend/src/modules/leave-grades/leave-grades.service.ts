import { prisma } from '@/utils/prisma';
import { AppError } from '@/utils/appError';
import { AuthContext, LeaveGradeCreateData, LeaveGradeUpdateData } from './leave-grades.types';
import { Role } from '@prisma/client';

/**
 * Leave Grade Service Layer
 * Handles all business logic for leave grade management
 */
export class LeaveGradeService {
  /**
   * Get all leave grades for a company with pagination and filtering
   */
  static async getLeaveGrades({
    authContext,
    companyId,
    page = 1,
    limit = 20,
    name,
  }: {
    authContext: AuthContext;
    companyId: string;
    page?: number;
    limit?: number;
    name?: string;
  }) {
    // Validate company access
    await this.validateCompanyAccess(authContext, companyId);

    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {
      companyId,
    };

    if (name) {
      whereClause.name = {
        contains: name,
        mode: 'insensitive',
      };
    }

    const [leaveGrades, total] = await Promise.all([
      prisma.leaveGrade.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          policies: {
            orderBy: { leaveType: 'asc' },
          },
          _count: {
            select: { employees: true },
          },
        },
      }),
      prisma.leaveGrade.count({ where: whereClause }),
    ]);

    return {
      leaveGrades: leaveGrades.map((grade) => ({
        id: grade.id,
        companyId: grade.companyId,
        name: grade.name,
        policies: grade.policies.map((policy) => ({
          leaveType: policy.leaveType,
          totalDays: policy.totalDays,
          carryForward: policy.carryForward,
          maxCarryAmount: policy.maxCarryAmount,
        })),
        employeeCount: grade._count.employees,
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
   * Get leave grade by ID with detailed information
   */
  static async getLeaveGradeById({
    authContext,
    companyId,
    leaveGradeId,
  }: {
    authContext: AuthContext;
    companyId: string;
    leaveGradeId: string;
  }) {
    // Validate company access
    await this.validateCompanyAccess(authContext, companyId);

    const leaveGrade = await prisma.leaveGrade.findUnique({
      where: { id: leaveGradeId },
      include: {
        policies: {
          orderBy: { leaveType: 'asc' },
        },
        employees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            code: true,
            status: true,
          },
          orderBy: [
            { firstName: 'asc' },
            { lastName: 'asc' },
          ],
        },
        _count: {
          select: { employees: true },
        },
      },
    });

    if (!leaveGrade) {
      throw new AppError('Leave grade not found', 404);
    }

    if (leaveGrade.companyId !== companyId) {
      throw new AppError('Access denied. Leave grade belongs to different company.', 403);
    }

    return {
      id: leaveGrade.id,
      companyId: leaveGrade.companyId,
      name: leaveGrade.name,
      policies: leaveGrade.policies.map((policy) => ({
        id: policy.id,
        leaveType: policy.leaveType,
        totalDays: policy.totalDays,
        carryForward: policy.carryForward,
        maxCarryAmount: policy.maxCarryAmount,
      })),
      employeeCount: leaveGrade._count.employees,
      employees: leaveGrade.employees.map((employee) => ({
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        fullName: `${employee.firstName} ${employee.lastName}`,
        code: employee.code,
        status: employee.status,
      })),
    };
  }

  /**
   * Create a new leave grade
   */
  static async createLeaveGrade({
    authContext,
    companyId,
    data,
  }: {
    authContext: AuthContext;
    companyId: string;
    data: LeaveGradeCreateData;
  }) {
    // Validate permissions (only admins can create leave grades)
    this.requireAdminPermissions(authContext.role);

    // Validate company access
    await this.validateCompanyAccess(authContext, companyId);

    // Check if leave grade name already exists in company
    const existingLeaveGrade = await prisma.leaveGrade.findFirst({
      where: {
        companyId,
        name: data.name,
      },
    });

    if (existingLeaveGrade) {
      throw new AppError('Leave grade with this name already exists', 400);
    }

    // Validate policies - ensure no duplicate leave types
    const leaveTypes = data.policies.map((p) => p.leaveType);
    const uniqueLeaveTypes = new Set(leaveTypes);
    if (leaveTypes.length !== uniqueLeaveTypes.size) {
      throw new AppError('Duplicate leave types found in policies', 400);
    }

    const leaveGrade = await prisma.leaveGrade.create({
      data: {
        companyId,
        name: data.name,
        policies: {
          createMany: {
            data: data.policies.map((policy) => ({
              leaveType: policy.leaveType,
              totalDays: policy.totalDays,
              carryForward: policy.carryForward,
              maxCarryAmount: policy.maxCarryAmount || 0,
            })),
          },
        },
      },
      include: {
        policies: {
          orderBy: { leaveType: 'asc' },
        },
        _count: {
          select: { employees: true },
        },
      },
    });

    return {
      id: leaveGrade.id,
      companyId: leaveGrade.companyId,
      name: leaveGrade.name,
      policies: leaveGrade.policies.map((policy) => ({
        leaveType: policy.leaveType,
        totalDays: policy.totalDays,
        carryForward: policy.carryForward,
        maxCarryAmount: policy.maxCarryAmount,
      })),
      employeeCount: leaveGrade._count.employees,
    };
  }

  /**
   * Update a leave grade
   */
  static async updateLeaveGrade({
    authContext,
    companyId,
    leaveGradeId,
    data,
  }: {
    authContext: AuthContext;
    companyId: string;
    leaveGradeId: string;
    data: LeaveGradeUpdateData;
  }) {
    // Validate permissions
    this.requireAdminPermissions(authContext.role);

    // Validate company access
    await this.validateCompanyAccess(authContext, companyId);

    const leaveGrade = await prisma.leaveGrade.findUnique({
      where: { id: leaveGradeId },
    });

    if (!leaveGrade) {
      throw new AppError('Leave grade not found', 404);
    }

    if (leaveGrade.companyId !== companyId) {
      throw new AppError('Access denied. Leave grade belongs to different company.', 403);
    }

    // Check if new name conflicts
    if (data.name && data.name !== leaveGrade.name) {
      const existingLeaveGrade = await prisma.leaveGrade.findFirst({
        where: {
          companyId,
          name: data.name,
          id: { not: leaveGradeId },
        },
      });

      if (existingLeaveGrade) {
        throw new AppError('Leave grade with this name already exists', 400);
      }
    }

    // Validate policies if provided
    if (data.policies) {
      const leaveTypes = data.policies.map((p) => p.leaveType);
      const uniqueLeaveTypes = new Set(leaveTypes);
      if (leaveTypes.length !== uniqueLeaveTypes.size) {
        throw new AppError('Duplicate leave types found in policies', 400);
      }
    }

    // Use transaction to update leave grade and policies
    const updatedLeaveGrade = await prisma.$transaction(async (tx) => {
      // Update leave grade
      const grade = await tx.leaveGrade.update({
        where: { id: leaveGradeId },
        data: {
          name: data.name,
        },
      });

      // Update policies if provided
      if (data.policies) {
        // Delete existing policies
        await tx.leavePolicy.deleteMany({
          where: { leaveGradeId },
        });

        // Create new policies
        await tx.leavePolicy.createMany({
          data: data.policies.map((policy) => ({
            leaveGradeId,
            leaveType: policy.leaveType,
            totalDays: policy.totalDays,
            carryForward: policy.carryForward,
            maxCarryAmount: policy.maxCarryAmount || 0,
          })),
        });
      }

      // Return updated leave grade with policies
      return tx.leaveGrade.findUnique({
        where: { id: leaveGradeId },
        include: {
          policies: {
            orderBy: { leaveType: 'asc' },
          },
          _count: {
            select: { employees: true },
          },
        },
      });
    });

    return {
      id: updatedLeaveGrade!.id,
      companyId: updatedLeaveGrade!.companyId,
      name: updatedLeaveGrade!.name,
      policies: updatedLeaveGrade!.policies.map((policy) => ({
        leaveType: policy.leaveType,
        totalDays: policy.totalDays,
        carryForward: policy.carryForward,
        maxCarryAmount: policy.maxCarryAmount,
      })),
      employeeCount: updatedLeaveGrade!._count.employees,
    };
  }

  /**
   * Delete a leave grade
   */
  static async deleteLeaveGrade({
    authContext,
    companyId,
    leaveGradeId,
  }: {
    authContext: AuthContext;
    companyId: string;
    leaveGradeId: string;
  }) {
    // Validate permissions (only super admin can delete leave grades)
    this.requireSuperAdminPermissions(authContext.role);

    // Validate company access
    await this.validateCompanyAccess(authContext, companyId);

    const leaveGrade = await prisma.leaveGrade.findUnique({
      where: { id: leaveGradeId },
      include: {
        employees: true,
        _count: {
          select: { employees: true },
        },
      },
    });

    if (!leaveGrade) {
      throw new AppError('Leave grade not found', 404);
    }

    if (leaveGrade.companyId !== companyId) {
      throw new AppError('Access denied. Leave grade belongs to different company.', 403);
    }

    // Check if leave grade is assigned to any employees
    if (leaveGrade._count.employees > 0) {
      throw new AppError(
        'Cannot delete leave grade. It is assigned to employees. Please reassign employees to another leave grade first.',
        400
      );
    }

    await prisma.leaveGrade.delete({
      where: { id: leaveGradeId },
    });

    return { message: 'Leave grade deleted successfully' };
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
    const adminRoles = [Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.HR_ADMIN];
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
}