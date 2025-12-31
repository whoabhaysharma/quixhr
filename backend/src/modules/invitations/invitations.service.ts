import { prisma } from '@/utils/prisma';
import { AppError } from '@/utils/appError';
import { AuthContext, InvitationCreateData, InvitationAcceptanceData } from './invitations.types';
import { Role } from '@prisma/client';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * Invitation Service Layer
 * Handles all business logic for invitation management
 */
export class InvitationService {
  /**
   * Get all invitations for a company with pagination and filtering
   */
  static async getInvitations({
    authContext,
    companyId,
    page = 1,
    limit = 20,
    email,
    role,
    status,
  }: {
    authContext: AuthContext;
    companyId: string;
    page?: number;
    limit?: number;
    email?: string;
    role?: Role;
    status?: string;
  }) {
    // Validate company access
    await this.validateCompanyAccess(authContext, companyId);

    // Only admins can view invitations
    this.requireAdminPermissions(authContext.role);

    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {
      companyId,
    };

    if (email) {
      whereClause.email = {
        contains: email,
        mode: 'insensitive',
      };
    }

    if (role) {
      whereClause.role = role;
    }

    if (status) {
      whereClause.status = status;
    }

    const [invitations, total] = await Promise.all([
      prisma.invitation.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.invitation.count({ where: whereClause }),
    ]);

    return {
      invitations: invitations.map((invitation) => ({
        id: invitation.id,
        companyId: invitation.companyId,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        createdAt: new Date(), // Add createdAt from schema
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
   * Get invitation by token (for acceptance page)
   */
  static async getInvitationByToken({ token }: { token: string }) {
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new AppError('Invitation not found', 404);
    }

    if (invitation.status !== 'PENDING') {
      throw new AppError('Invitation has already been processed', 400);
    }

    if (invitation.expiresAt < new Date()) {
      throw new AppError('Invitation has expired', 400);
    }

    return {
      id: invitation.id,
      companyId: invitation.companyId,
      companyName: invitation.company.name,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      createdAt: new Date(), // Add createdAt from schema
    };
  }

  /**
   * Create a new invitation
   */
  static async createInvitation({
    authContext,
    companyId,
    data,
  }: {
    authContext: AuthContext;
    companyId: string;
    data: InvitationCreateData;
  }) {
    // Validate permissions (only admins can create invitations)
    this.requireAdminPermissions(authContext.role);

    // Validate company access
    await this.validateCompanyAccess(authContext, companyId);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
      include: {
        employee: true,
      },
    });

    if (existingUser) {
      if (existingUser.employee) {
        throw new AppError('User already has an employee profile', 400);
      }
      // If user exists but no employee profile, that's fine - they can accept the invitation
    }

    // Check for existing pending invitation
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        companyId,
        email: data.email,
        status: 'PENDING',
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (existingInvitation) {
      throw new AppError('A pending invitation already exists for this email', 400);
    }

    // Generate unique token
    const token = this.generateInvitationToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (data.expiresInHours || 72));

    const invitation = await prisma.invitation.create({
      data: {
        companyId,
        email: data.email,
        role: data.role,
        token,
        expiresAt,
        status: 'PENDING',
      },
    });

    // TODO: Send invitation email here
    // await this.sendInvitationEmail(invitation);

    return {
      id: invitation.id,
      companyId: invitation.companyId,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      createdAt: new Date(), // Add createdAt from schema
    };
  }

  /**
   * Accept an invitation and create user/employee account
   */
  static async acceptInvitation({ data }: { data: InvitationAcceptanceData }) {
    const invitation = await prisma.invitation.findUnique({
      where: { token: data.token },
      include: {
        company: true,
      },
    });

    if (!invitation) {
      throw new AppError('Invitation not found', 404);
    }

    if (invitation.status !== 'PENDING') {
      throw new AppError('Invitation has already been processed', 400);
    }

    if (invitation.expiresAt < new Date()) {
      throw new AppError('Invitation has expired', 400);
    }

    // Check if employee code is unique within company
    if (data.employeeCode) {
      const existingEmployee = await prisma.employee.findFirst({
        where: {
          companyId: invitation.companyId,
          code: data.employeeCode,
        },
      });

      if (existingEmployee) {
        throw new AppError('Employee code already exists in this company', 400);
      }
    }

    // Validate resources belong to the company
    await this.validateResourcesAccess(invitation.companyId, data.calendarId, data.leaveGradeId);

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Use transaction to create user and employee atomically
    const result = await prisma.$transaction(async (tx) => {
      // Create or update user
      let user = await tx.user.findUnique({
        where: { email: invitation.email },
      });

      if (user) {
        // Update existing user
        user = await tx.user.update({
          where: { id: user.id },
          data: {
            password: hashedPassword,
            role: invitation.role,
            isEmailVerified: true,
          },
        });
      } else {
        // Create new user
        user = await tx.user.create({
          data: {
            email: invitation.email,
            password: hashedPassword,
            role: invitation.role,
            isEmailVerified: true,
          },
        });
      }

      // Create employee profile
      const employee = await tx.employee.create({
        data: {
          companyId: invitation.companyId,
          userId: user.id,
          firstName: data.firstName,
          lastName: data.lastName,
          code: data.employeeCode,
          status: 'ACTIVE',
          joiningDate: data.joiningDate ? new Date(data.joiningDate) : new Date(),
          calendarId: data.calendarId,
          leaveGradeId: data.leaveGradeId,
        },
      });

      // Mark invitation as accepted
      await tx.invitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
        },
      });

      return { user, employee };
    });

    // Generate JWT token for immediate login
    const jwtToken = this.generateJWTToken({
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role,
      employeeId: result.employee.id,
      companyId: result.employee.companyId,
    });

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        isEmailVerified: result.user.isEmailVerified,
      },
      employee: {
        id: result.employee.id,
        firstName: result.employee.firstName,
        lastName: result.employee.lastName,
        fullName: `${result.employee.firstName} ${result.employee.lastName}`,
        code: result.employee.code,
        status: result.employee.status,
        joiningDate: result.employee.joiningDate,
      },
      company: {
        id: invitation.company.id,
        name: invitation.company.name,
      },
      token: jwtToken,
    };
  }

  /**
   * Resend an invitation
   */
  static async resendInvitation({
    authContext,
    companyId,
    invitationId,
  }: {
    authContext: AuthContext;
    companyId: string;
    invitationId: string;
  }) {
    // Validate permissions
    this.requireAdminPermissions(authContext.role);

    // Validate company access
    await this.validateCompanyAccess(authContext, companyId);

    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new AppError('Invitation not found', 404);
    }

    if (invitation.companyId !== companyId) {
      throw new AppError('Access denied. Invitation belongs to different company.', 403);
    }

    if (invitation.status !== 'PENDING') {
      throw new AppError('Can only resend pending invitations', 400);
    }

    // Generate new token and extend expiry
    const newToken = this.generateInvitationToken();
    const newExpiresAt = new Date();
    newExpiresAt.setHours(newExpiresAt.getHours() + 72);

    const updatedInvitation = await prisma.invitation.update({
      where: { id: invitationId },
      data: {
        token: newToken,
        expiresAt: newExpiresAt,
      },
    });

    // TODO: Send invitation email here
    // await this.sendInvitationEmail(updatedInvitation);

    return {
      id: updatedInvitation.id,
      companyId: updatedInvitation.companyId,
      email: updatedInvitation.email,
      role: updatedInvitation.role,
      status: updatedInvitation.status,
      expiresAt: updatedInvitation.expiresAt,
      createdAt: new Date(), // Add createdAt from schema
    };
  }

  /**
   * Cancel an invitation
   */
  static async cancelInvitation({
    authContext,
    companyId,
    invitationId,
  }: {
    authContext: AuthContext;
    companyId: string;
    invitationId: string;
  }) {
    // Validate permissions
    this.requireAdminPermissions(authContext.role);

    // Validate company access
    await this.validateCompanyAccess(authContext, companyId);

    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new AppError('Invitation not found', 404);
    }

    if (invitation.companyId !== companyId) {
      throw new AppError('Access denied. Invitation belongs to different company.', 403);
    }

    if (invitation.status !== 'PENDING') {
      throw new AppError('Can only cancel pending invitations', 400);
    }

    await prisma.invitation.update({
      where: { id: invitationId },
      data: {
        status: 'CANCELLED',
      },
    });

    return { message: 'Invitation cancelled successfully' };
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

  /**
   * Generate unique invitation token
   */
  private static generateInvitationToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Generate JWT token for immediate login after invitation acceptance
   */
  private static generateJWTToken(payload: {
    userId: string;
    email: string;
    role: Role;
    employeeId: string;
    companyId: string;
  }): string {
    // TODO: Implement JWT token generation
    // This should use the same JWT service used in the auth module
    return 'jwt-token-placeholder';
  }

  /**
   * Send invitation email
   * TODO: Implement email service integration
   */
  private static async sendInvitationEmail(invitation: any) {
    // TODO: Implement email sending logic
    console.log(`Sending invitation email to ${invitation.email} with token ${invitation.token}`);
  }
}