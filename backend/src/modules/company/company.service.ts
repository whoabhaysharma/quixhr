import prisma from '@/utils/prisma';
import { AppError } from '@/utils/appError';
import { UpdateCompanyDTO, DashboardStats, UpdateUserRoleDTO } from './company.types';
import { startOfDay, endOfDay } from 'date-fns';
import { Role } from '@prisma/client';

/**
 * Get company profile
 */
export const getCompanyProfile = async (companyId: string) => {
    const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: {
            id: true,
            name: true,
            timezone: true,
            currency: true,
            dateFormat: true,
            logoUrl: true,
            createdAt: true,
        },
    });

    if (!company) {
        throw new AppError('Company not found', 404);
    }

    return company;
};

/**
 * Update company settings
 */
export const updateCompanySettings = async (companyId: string, data: UpdateCompanyDTO) => {
    const company = await prisma.company.findUnique({
        where: { id: companyId },
    });

    if (!company) {
        throw new AppError('Company not found', 404);
    }

    const updated = await prisma.company.update({
        where: { id: companyId },
        data: {
            logoUrl: data.logoUrl,
            currency: data.currency,
            timezone: data.timezone,
            dateFormat: data.dateFormat,
        },
        select: {
            id: true,
            name: true,
            timezone: true,
            currency: true,
            dateFormat: true,
            logoUrl: true,
        },
    });

    return updated;
};

/**
 * Get dashboard statistics
 */
export const getDashboardStats = async (companyId: string): Promise<DashboardStats> => {
    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);

    // Get headcount
    const [totalEmployees, activeEmployees, inactiveEmployees] = await Promise.all([
        prisma.employee.count({
            where: { companyId },
        }),
        prisma.employee.count({
            where: { companyId, status: 'ACTIVE' },
        }),
        prisma.employee.count({
            where: { companyId, status: { not: 'ACTIVE' } },
        }),
    ]);

    // Get today's attendance stats
    const todayAttendance = await prisma.attendance.findMany({
        where: {
            employee: { companyId },
            date: {
                gte: startOfToday,
                lte: endOfToday,
            },
        },
        select: {
            status: true,
        },
    });

    const attendanceStats = {
        present: todayAttendance.filter((a) => a.status === 'PRESENT').length,
        absent: todayAttendance.filter((a) => a.status === 'ABSENT').length,
        onLeave: todayAttendance.filter((a) => a.status === 'ON_LEAVE').length,
        notMarked: activeEmployees - todayAttendance.length,
    };

    // Get pending leave requests
    const pendingLeaveRequests = await prisma.leaveRequest.findMany({
        where: {
            employee: { companyId },
            status: 'PENDING',
        },
        select: {
            id: true,
            startDate: true,
            endDate: true,
            daysTaken: true,
            type: true,
            employee: {
                select: {
                    firstName: true,
                    lastName: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: 10, // Limit to 10 most recent
    });

    const stats: DashboardStats = {
        headcount: {
            total: totalEmployees,
            active: activeEmployees,
            inactive: inactiveEmployees,
        },
        todayAttendance: attendanceStats,
        pendingLeaves: {
            count: pendingLeaveRequests.length,
            requests: pendingLeaveRequests.map((req) => ({
                id: req.id,
                employeeName: `${req.employee.firstName} ${req.employee.lastName}`,
                leaveType: req.type,
                startDate: req.startDate,
                endDate: req.endDate,
                daysTaken: req.daysTaken,
            })),
        },
    };

    return stats;
};

/**
 * List all users in the company
 */
export const listUsers = async (companyId: string, roleFilter?: Role) => {
    const where: any = {
        employee: {
            companyId,
        },
    };

    if (roleFilter) {
        where.role = roleFilter;
    }

    const users = await prisma.user.findMany({
        where,
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
                    status: true,
                    joiningDate: true,
                },
            },
        },
        orderBy: {
            email: 'asc',
        },
    });

    return users;
};

/**
 * Update user role (Promote/Demote)
 */
export const updateUserRole = async (
    userId: string,
    companyId: string,
    updaterRole: Role,
    data: UpdateUserRoleDTO
) => {
    // Import role hierarchy check
    const { canModifyRole } = await import('@/utils/roleHierarchy');

    // Verify user belongs to the company
    const user = await prisma.user.findFirst({
        where: {
            id: userId,
            employee: {
                companyId,
            },
        },
        include: {
            employee: true,
        },
    });

    if (!user) {
        throw new AppError('User not found in this company', 404);
    }

    // Prevent changing SUPER_ADMIN role
    if (user.role === Role.SUPER_ADMIN || data.role === Role.SUPER_ADMIN) {
        throw new AppError('Cannot modify SUPER_ADMIN role', 403);
    }

    // Check if updater can modify this user's role
    if (!canModifyRole(updaterRole, user.role, data.role as Role)) {
        throw new AppError(
            "You cannot modify this user's role. You can only modify roles lower than your own and assign roles equal to or lower than your own.",
            403
        );
    }

    const updated = await prisma.user.update({
        where: { id: userId },
        data: { role: data.role as Role },
        select: {
            id: true,
            email: true,
            role: true,
            employee: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                },
            },
        },
    });

    return updated;
};

