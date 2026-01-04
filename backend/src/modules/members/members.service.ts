import { prisma } from '@/utils/prisma';
import { AppError } from '@/utils/appError';
import { ParsedPagination } from '@/utils/pagination';
import { buildOrderBy } from '@/utils/prismaHelpers';
import { GetUsersQuery, CreateEmployeeInput, UpdateEmployeeInput, GetEmployeesQuery } from './members.schema';
import { Role, Prisma } from '@prisma/client';
import { validateOrganizationResource } from '@/utils/prismaHelpers';
import { canModifyRole, canManageRole } from '@/utils/roleHierarchy';

export class MemberService {
    static async getUsers(
        pagination: ParsedPagination,
        filters: GetUsersQuery
    ) {
        const { page, limit, skip, sortBy, sortOrder, search } = pagination;
        const { role, email } = filters;

        const where: any = {};

        if (role) where.role = role;
        if (email || search) {
            where.email = {
                contains: email || search,
                mode: 'insensitive',
            };
        }

        const orderBy = buildOrderBy(sortBy, sortOrder, {
            allowedFields: ['email', 'role', 'createdAt'],
            defaultSort: { createdAt: 'desc' },
        });

        const [data, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: orderBy as any,
                select: {
                    id: true,
                    email: true,
                    role: true,
                    isEmailVerified: true,
                    employee: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            organizationId: true,
                        },
                    },
                },
            }),
            prisma.user.count({ where }),
        ]);

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

    static async getUserById(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                role: true,
                isEmailVerified: true,
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        organizationId: true,
                        status: true,
                    },
                },
            },
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        return user;
    }

    // =========================================================================
    // EMPLOYEE MANAGEMENT (Previously in EmployeeService)
    // =========================================================================

    /**
     * Get all employees (organization scoped)
     */
    static async getEmployees(
        organizationId: string,
        query: ParsedPagination,
        filters: Pick<GetEmployeesQuery, 'status' | 'calendarId' | 'leaveGradeId' | 'role'> & { allowedRoles?: Role[] }
    ) {
        const { page, limit, skip, search, sortBy, sortOrder } = query;

        // 1. Build Where Clause
        const where: Prisma.EmployeeWhereInput = {
            organizationId,
            ...(filters.status && { status: filters.status }),
            ...(filters.calendarId && { calendarId: filters.calendarId }),
            ...(filters.leaveGradeId && { leaveGradeId: filters.leaveGradeId }),
            user: {
                ...(filters.role && { role: filters.role }), // Explicit filter
                ...(filters.allowedRoles && { role: { in: filters.allowedRoles } }) // RBAC Restriction
            }
        };

        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
                { user: { email: { contains: search, mode: 'insensitive' } } },
            ];
        }

        // 2. Build Order By Clause
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

        // 3. Execute Query
        const [employees, total] = await Promise.all([
            prisma.employee.findMany({
                where,
                skip,
                take: limit,
                orderBy: orderBy as any, // Cast due to dynamic helper types
                include: {
                    user: { select: { id: true, email: true, role: true, isEmailVerified: true } },
                    calendar: { select: { id: true, name: true } },
                    leaveGrade: { select: { id: true, name: true } },
                },
            }),
            prisma.employee.count({ where }),
        ]);

        // 4. Transform Result
        const data = employees.map(emp => ({
            ...emp,
            fullName: `${emp.firstName} ${emp.lastName}`,
            email: emp.user?.email,
            role: emp.user?.role,
            user: undefined,
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
     * Get Single Employee by ID
     */
    static async getEmployee(organizationId: string, id: string) {
        const employee = await prisma.employee.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, email: true, role: true, isEmailVerified: true } },
                calendar: true,
                leaveGrade: { include: { policies: true } },
            },
        });

        if (!employee) throw new AppError('Employee not found', 404);
        if (employee.organizationId !== organizationId) throw new AppError('Access denied', 403);

        return employee;
    }

    /**
     * Create Employee
     */
    static async createEmployee(organizationId: string, data: CreateEmployeeInput) {
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
                    if (linked) throw new AppError('User already linked', 400);
                } else {
                    user = await tx.user.create({
                        data: {
                            email: data.email,
                            password: 'temporary-password',
                            role: data.role || Role.EMPLOYEE,
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
     * Update Employee
     */
    static async updateEmployee(organizationId: string, id: string, data: UpdateEmployeeInput, requesterRole: Role) {
        const employee = await validateOrganizationResource('employee', id, organizationId, 'Employee');

        if (data.code && data.code !== (employee as any).code) {
            // We might need to fetch code if validateOrganizationResource didn't return it.
            // Current validateOrganizationResource only selects ID. 
            // So for update logic relying on previous values, we might need a fetch.
            // Let's optimize: validateOrganizationResource is great for FKs, but main resource update needs data.
            const current = await prisma.employee.findUnique({ where: { id } });
            if (current && data.code !== current.code) {
                const exists = await prisma.employee.findFirst({ where: { organizationId, code: data.code } });
                if (exists) throw new AppError('Employee code already taken', 400);
            }
        }

        // 2. Fetch Current Data for RBAC and Logic
        const currentEmployee = await prisma.employee.findUnique({
            where: { id },
            include: { user: true }
        });

        if (!currentEmployee || !currentEmployee.user) {
            throw new AppError('Employee or associated user not found', 404);
        }

        // 3. RBAC: Strict Check (Lower cannot modify Higher/Equal)
        const targetRole = currentEmployee.user.role;
        const newRole = data.role || targetRole;

        // "changing the role or editing the information ... should only be allowed to the lower roles by higher roles"
        // This implies I cannot even EDIT if I am not strictly higher.
        if (!canModifyRole(requesterRole, targetRole, newRole)) {
            throw new AppError('You do not have permission to modify this member or assign this role.', 403);
        }

        // 4. Last Admin Protection
        if (targetRole === Role.ORG_ADMIN && newRole !== Role.ORG_ADMIN) {
            // We are demoting an Admin. Check if they are the last one.
            const adminCount = await prisma.user.count({
                where: {
                    role: Role.ORG_ADMIN,
                    employee: { organizationId }
                }
            });
            if (adminCount <= 1) {
                throw new AppError('Cannot demote the last Organization Admin.', 400);
            }
        }

        if (data.calendarId) await validateOrganizationResource('calendar', data.calendarId, organizationId, 'Calendar');
        if (data.leaveGradeId) await validateOrganizationResource('leaveGrade', data.leaveGradeId, organizationId, 'Leave Grade');

        // 5. Update Transaction (Update Employee AND User Role if needed)
        return await prisma.$transaction(async (tx) => {
            // Update Role if changed
            if (data.role && data.role !== targetRole) {
                await tx.user.update({
                    where: { id: currentEmployee.userId! },
                    data: { role: data.role }
                });
            }

            return await tx.employee.update({
                where: { id },
                data: {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    code: data.code,
                    status: data.status as any,
                    joiningDate: data.joiningDate ? new Date(data.joiningDate) : undefined,
                    calendarId: data.calendarId,
                    leaveGradeId: data.leaveGradeId,
                },
                include: { user: { select: { email: true, role: true } } }
            });
        });
    }

    /**
     * Delete Employee
     */
    static async deleteEmployee(organizationId: string, id: string, requesterRole: Role) {
        /* validateOrganizationResource is enough for access check, 
       but we need relations to check constraints. */
        const employee = await prisma.employee.findFirst({
            where: { id, organizationId },
            include: {
                user: true,
                attendance: { take: 1 },
                leaveRequests: { take: 1 },
                leaveAllocations: { take: 1 }
            }
        });

        if (!employee) throw new AppError('Employee not found', 404);

        // RBAC Check
        if (employee.user && !canManageRole(requesterRole, employee.user.role)) {
            throw new AppError('You cannot remove a member with a role equal to or higher than yours.', 403);
        }

        // Last Admin Check
        if (employee.user && employee.user.role === Role.ORG_ADMIN) {
            const adminCount = await prisma.user.count({
                where: {
                    role: Role.ORG_ADMIN,
                    employee: { organizationId }
                }
            });
            if (adminCount <= 1) {
                throw new AppError('Cannot delete the last Organization Admin.', 400);
            }
        }

        if (employee.attendance.length > 0 || employee.leaveRequests.length > 0 || employee.leaveAllocations.length > 0) {
            throw new AppError('Cannot delete employee with existing history. Deactivate instead.', 400);
        }

        await prisma.employee.delete({ where: { id } });
    }
}
