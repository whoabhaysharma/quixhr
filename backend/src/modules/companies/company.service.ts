import prisma from '../../utils/prisma';
import { Company, AttendanceStatus, LeaveStatus } from '@prisma/client';

export const create = async (data: any) => {
    return prisma.company.create({
        data
    });
};

export const findById = async (id: string) => {
    return prisma.company.findUnique({
        where: { id },
        include: {
            _count: {
                select: { employees: true }
            }
        }
    });
};

export const findAll = async ({ page, limit, search }: { page: number, limit: number, search?: string }) => {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
        where.name = { contains: search, mode: 'insensitive' };
    }

    const [companies, total] = await Promise.all([
        prisma.company.findMany({
            where,
            skip,
            take: limit,
            include: {
                _count: {
                    select: { employees: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        }),
        prisma.company.count({ where })
    ]);

    return {
        companies,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
};

export const update = async (id: string, data: any) => {
    return prisma.company.update({
        where: { id },
        data
    });
};

export const getDashboardStats = async (companyId: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const [
        totalEmployees,
        pendingLeaves,
        todayAttendance,
        recentJoiners,
        upcomingHolidays,
        leaveStats,
        pendingLeaveRequests
    ] = await Promise.all([
        // 1. Total Active Employees
        prisma.employee.count({
            where: { companyId, status: 'ACTIVE' }
        }),

        // 2. Pending Leave Requests Count
        prisma.leaveRequest.count({
            where: {
                employee: { companyId },
                status: 'PENDING'
            }
        }),

        // 3. Today's Attendance
        prisma.attendance.groupBy({
            by: ['status'],
            where: {
                employee: { companyId },
                date: {
                    gte: today,
                    lt: tomorrow
                }
            },
            _count: true
        }),

        // 4. Recent Joiners
        prisma.employee.findMany({
            where: { companyId, status: 'ACTIVE' },
            orderBy: { joiningDate: 'desc' },
            take: 5,
            include: { user: { select: { email: true } } }
        }),

        // 5. Upcoming Holidays
        prisma.calendarHoliday.findMany({
            where: {
                calendar: { companyId },
                date: { gte: today }
            },
            orderBy: { date: 'asc' },
            take: 3
        }),

        // 6. Leave Distribution (by type, approved, this year)
        prisma.leaveRequest.groupBy({
            by: ['type'],
            where: {
                employee: { companyId },
                status: 'APPROVED',
                startDate: {
                    gte: new Date(new Date().getFullYear(), 0, 1)
                }
            },
            _count: true
        }),

        // 7. Recent Pending Leaves (for Action Center)
        prisma.leaveRequest.findMany({
            where: {
                employee: { companyId },
                status: 'PENDING'
            },
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { employee: true }
        })
    ]);

    // Process Attendance Counts
    const attendanceMap = todayAttendance.reduce((acc, curr) => {
        acc[curr.status] = curr._count;
        return acc;
    }, {} as Record<AttendanceStatus, number>);

    return {
        totalEmployees,
        pendingLeaves: pendingLeaves, // Count
        presentToday: attendanceMap.PRESENT || 0,
        absentToday: attendanceMap.ABSENT || 0,
        onLeaveToday: attendanceMap.ON_LEAVE || 0,
        recentJoiners: recentJoiners.map(e => ({
            id: e.id,
            name: `${e.firstName} ${e.lastName}`,
            email: e.user?.email,
            avatar: null,
            joinedAt: e.joiningDate
        })),
        upcomingHolidays: upcomingHolidays.map(h => ({
            id: h.id,
            name: h.name,
            date: h.date,
            description: h.isOptional ? 'Optional Holiday' : 'Public Holiday'
        })),
        leaveDistribution: leaveStats.map(s => ({
            name: s.type,
            value: s._count
        })),
        pendingLeaveRequests: pendingLeaveRequests // List
    };
};

export const getAuditLogs = async (companyId: string, { page, limit }: { page: number, limit: number }) => {
    const skip = (page - 1) * limit;

    const employees = await prisma.employee.findMany({
        where: { companyId },
        select: { userId: true }
    });

    const userIds = employees.map(e => e.userId).filter(Boolean) as string[];

    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
            where: {
                userId: { in: userIds }
            },
            include: { user: { include: { employee: true } } },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        }),
        prisma.auditLog.count({
            where: {
                userId: { in: userIds }
            }
        })
    ]);

    return { logs, total };
};
