import { prisma } from '@/utils/prisma';
import { AppError } from '@/utils/appError';
import { Role, Prisma } from '@prisma/client';
import { CreateMemberInput, UpdateMemberInput, GetMembersQuery } from './members.schema';
import { ParsedPagination } from '@/utils/pagination';
import { buildOrderBy, validateOrganizationResource } from '@/utils/prismaHelpers';
import { getViewableRoles, canManageRole } from '@/utils/roleHierarchy';

export class MemberService {
  /**
   * Get all members with pagination, sorting, and filtering
   */
  static async getMembers(
    organizationId: string,
    currentUserRole: Role,
    currentUserId: string,
    query: ParsedPagination,
    filters: Pick<GetMembersQuery, 'status' | 'calendarId' | 'leaveGradeId' | 'role'>
  ) {
    const { page, limit, skip, search, sortBy, sortOrder } = query;

    // 1. Determine Access
    // "Lower role user cannot get the higher one"
    const allowedRoles = getViewableRoles(currentUserRole);

    // Filter Logic:
    // If user requests a specific role:
    //   - If it's in allowedRoles, use it.
    //   - If it's NOT in allowedRoles, return empty (force impossible condition) or error.
    // If user does NOT request a specific role:
    //   - Return all allowedRoles.

    let roleFilter: Prisma.EnumRoleFilter | Role | undefined;

    if (filters.role) {
        if (allowedRoles.includes(filters.role)) {
            roleFilter = filters.role;
        } else {
            // User requested a role they are not allowed to see
            // We can either throw 403 or return empty. Returning empty is safer/standard for lists.
            // Using a role that doesn't exist or similar to force empty result.
            // Actually, best way is to let the intersection handle it, but Prisma doesn't do "AND" on same field easily in implicit way.
            // Let's just return empty array immediately if we want to be efficient, or force a fail condition.
            return {
                data: [],
                pagination: { total: 0, page, limit, totalPages: 0 }
            };
        }
    } else {
        roleFilter = { in: allowedRoles };
    }

    const where: Prisma.EmployeeWhereInput = {
      organizationId,
      ...(filters.status && { status: filters.status }),
      ...(filters.calendarId && { calendarId: filters.calendarId }),
      ...(filters.leaveGradeId && { leaveGradeId: filters.leaveGradeId }),
      user: {
        role: roleFilter
      }
    };

    // 2. Strict Privacy for Employees
    // "Employee user should not be able to get other users information"
    // If the caller is an EMPLOYEE, they can ONLY see themselves.
    if (currentUserRole === Role.EMPLOYEE) {
      where.userId = currentUserId;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const orderBy = buildOrderBy(sortBy, sortOrder, {
      allowedFields: ['firstName', 'lastName', 'code', 'status', 'joiningDate', 'createdAt', 'updatedAt'],
      mappings: {
        email: (order) => ({ user: { email: order } }),
        role: (order) => ({ user: { role: order } }),
        calendar: (order) => ({ calendar: { name: order } }),
        leaveGrade: (order) => ({ leaveGrade: { name: order } }),
        fullName: (order) => ([{ firstName: order }, { lastName: order }])
      },
      defaultSort: { firstName: 'asc' }
    });

    const [members, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy: orderBy as any,
        include: {
          user: { select: { id: true, email: true, role: true, isEmailVerified: true } },
          calendar: { select: { id: true, name: true } },
          leaveGrade: { select: { id: true, name: true } },
        },
      }),
      prisma.employee.count({ where }),
    ]);

    const data = members.map(emp => ({
      ...emp,
      fullName: `${emp.firstName} ${emp.lastName}`,
      email: emp.user?.email,
      role: emp.user?.role,
      user: undefined, // Flatten the structure
    }));

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get Single Member by ID
   */
  static async getMember(organizationId: string, id: string, currentUserRole: Role, currentUserId: string) {
    const member = await prisma.employee.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, role: true, isEmailVerified: true } },
        calendar: true,
        leaveGrade: { include: { policies: true } },
      },
    });

    if (!member) throw new AppError('Member not found', 404);
    if (member.organizationId !== organizationId) throw new AppError('Access denied', 403);

    // Hierarchy Check
    const targetRole = member.user?.role || Role.EMPLOYEE;
    const allowedRoles = getViewableRoles(currentUserRole);
    if (!allowedRoles.includes(targetRole)) {
        throw new AppError('You do not have permission to view this member', 403);
    }

    // Strict Employee Privacy Check
    if (currentUserRole === Role.EMPLOYEE && member.userId !== currentUserId) {
        throw new AppError('Access denied', 403);
    }

    return member;
  }

  /**
   * Create Member
   */
  static async createMember(organizationId: string, data: CreateMemberInput, creatorRole: Role) {
    // 1. Check if creator can assign the requested role
    const requestedRole = data.role || Role.EMPLOYEE;
    // We enforce: You can only create users strictly lower than yourself (unless Super Admin override handled elsewhere)
    if (!canManageRole(creatorRole, requestedRole)) {
        throw new AppError('You cannot create a member with a role equal to or higher than your own', 403);
    }
    // For now, we assume middleware `restrictTo` handles the base permission to "create members".
    // We should validate the specific role being assigned.
    // Let's assume the schema validation is enough for now or rely on Service logic if we had strict role assignment rules in requirements.
    // The requirement "lower role user cannot get the higher one" was about Fetching.
    // But for security, let's ensure:
    // User cannot assign a role higher than or equal to their own.

    // 1. Validation: Code Uniqueness
    if (data.code) {
      const exists = await prisma.employee.findFirst({ where: { organizationId, code: data.code } });
      if (exists) throw new AppError('Employee code already exists', 400);
    }

    // 2. Validation: Resources
    if (data.calendarId) await validateOrganizationResource('calendar', data.calendarId, organizationId, 'Calendar');
    if (data.leaveGradeId) await validateOrganizationResource('leaveGrade', data.leaveGradeId, organizationId, 'Leave Grade');

    // 3. Transaction
    return await prisma.$transaction(async (tx) => {
      let userId: string | undefined;

      if (data.email) {
        let user = await tx.user.findUnique({ where: { email: data.email } });
        if (user) {
          const linked = await tx.employee.findUnique({ where: { userId: user.id } });
          if (linked) throw new AppError('User already linked to an employee record', 400);
        } else {
          user = await tx.user.create({
            data: {
              email: data.email,
              password: 'temporary-password', // Should be handled via invitation flow ideally
              role: requestedRole,
              isEmailVerified: false,
            }
          });
        }
        userId = user.id;
      }

      return await tx.employee.create({
        data: {
          organizationId,
          userId,
          firstName: data.firstName,
          lastName: data.lastName,
          code: data.code,
          status: data.status as any,
          joiningDate: new Date(data.joiningDate),
          calendarId: data.calendarId,
          leaveGradeId: data.leaveGradeId,
        },
        include: { user: { select: { email: true, role: true } } }
      });
    });
  }

  /**
   * Update Member
   */
  static async updateMember(organizationId: string, id: string, data: UpdateMemberInput, updaterRole: Role) {
    const member = await validateOrganizationResource('employee', id, organizationId, 'Member');

    // Hierarchy Check for Update
    // Need to fetch user role of the target member
    const targetMember = await prisma.employee.findUnique({ where: { id }, include: { user: true } });
    if (!targetMember) throw new AppError('Member not found', 404);

    const targetRole = targetMember.user?.role || Role.EMPLOYEE;

    if (!canManageRole(updaterRole, targetRole)) {
        throw new AppError('You cannot modify a member with a higher or equal role', 403);
    }

    if (data.role && targetMember.user) {
        // Check if trying to promote to a role higher than updater
        if (!canManageRole(updaterRole, data.role)) {
            throw new AppError('You cannot assign a role higher than or equal to your own', 403);
        }
    }

    if (data.code && data.code !== (member as any).code) {
      const exists = await prisma.employee.findFirst({ where: { organizationId, code: data.code } });
      if (exists) throw new AppError('Employee code already taken', 400);
    }

    if (data.calendarId) await validateOrganizationResource('calendar', data.calendarId, organizationId, 'Calendar');
    if (data.leaveGradeId) await validateOrganizationResource('leaveGrade', data.leaveGradeId, organizationId, 'Leave Grade');

    return await prisma.$transaction(async (tx) => {
        // Update User Role/Email if needed
        if ((data.email || data.role) && targetMember.userId) {
             await tx.user.update({
                where: { id: targetMember.userId },
                data: {
                    email: data.email,
                    role: data.role
                }
             });
        }

        return await tx.employee.update({
            where: { id },
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                code: data.code,
                joiningDate: data.joiningDate ? new Date(data.joiningDate) : undefined,
                status: data.status as any,
                calendarId: data.calendarId,
                leaveGradeId: data.leaveGradeId,
            },
            include: { user: { select: { email: true, role: true } } }
        });
    });
  }

  /**
   * Delete Member
   */
  static async deleteMember(organizationId: string, id: string, deleterRole: Role) {
    const member = await prisma.employee.findFirst({
      where: { id, organizationId },
      include: {
        user: true,
        attendance: { take: 1 },
        leaveRequests: { take: 1 },
        leaveAllocations: { take: 1 }
      }
    });

    if (!member) throw new AppError('Member not found', 404);

    const targetRole = member.user?.role || Role.EMPLOYEE;
    if (!canManageRole(deleterRole, targetRole)) {
        throw new AppError('You cannot delete a member with a higher or equal role', 403);
    }

    if (member.attendance.length > 0 || member.leaveRequests.length > 0 || member.leaveAllocations.length > 0) {
      throw new AppError('Cannot delete member with existing history. Deactivate instead.', 400);
    }

    await prisma.$transaction(async (tx) => {
        await tx.employee.delete({ where: { id } });
        // Optionally delete the user if they are not part of other orgs (Scope: User is global or org specific?)
        // Schema shows User has no OrgId. But Employee does.
        // If we delete Employee, the User remains. This is fine for now as User might be reused.
        // However, if the User was created just for this org, we might want to cleanup.
        // For now, keep User.
    });
  }
}
