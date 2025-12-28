import { PrismaClient, LeaveStatus, AttendanceType } from '@prisma/client';
import type {
    AdminStatsResponseDto,
    EmployeeStatsResponseDto,
    RecentJoiner,
    LeaveDistribution,
    UpcomingHoliday,
    RecentAttendance,
} from './dashboard.types';

const prisma = new PrismaClient();

/**
 * Get admin dashboard statistics
 */
export async function getAdminStats(companyId: string): Promise<AdminStatsResponseDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get total employees
    const totalEmployees = await prisma.employee.count({
        where: {
            companyId,
            status: 'ACTIVE',
        },
    });

    // Get today's attendance stats
    const todayAttendance = await prisma.attendance.groupBy({
        by: ['status'],
        where: {
            employee: {
                companyId,
            },
            date: {
                gte: today,
                lt: tomorrow,
            },
        },
        _count: {
            status: true,
        },
    });

    const presentToday = todayAttendance.find(a => a.status === AttendanceType.PRESENT)?._count.status || 0;
    const halfDayToday = todayAttendance.find(a => a.status === AttendanceType.HALF_DAY)?._count.status || 0;
    const absentToday = todayAttendance.find(a => a.status === AttendanceType.ABSENT)?._count.status || 0;

    // Get employees on leave today
    const onLeaveToday = await prisma.leaveRequest.count({
        where: {
            employee: {
                companyId,
            },
            status: LeaveStatus.APPROVED,
            startDate: {
                lte: today,
            },
            endDate: {
                gte: today,
            },
        },
    });

    // Get pending leave requests
    const pendingLeaves = await prisma.leaveRequest.count({
        where: {
            employee: {
                companyId,
            },
            status: LeaveStatus.PENDING,
        },
    });

    // Get recent joiners (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentJoiners: RecentJoiner[] = await prisma.employee.findMany({
        where: {
            companyId,
            createdAt: {
                gte: thirtyDaysAgo,
            },
        },
        select: {
            id: true,
            name: true,
            createdAt: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: 5,
    }).then(employees => employees.map(e => ({
        id: e.id,
        name: e.name,
        joinedAt: e.createdAt,
    })));

    // Get leave distribution
    const leaveDistribution: LeaveDistribution[] = await prisma.leaveRequest.groupBy({
        by: ['status'],
        where: {
            employee: {
                companyId,
            },
        },
        _count: {
            status: true,
        },
    }).then(results => results.map(r => ({
        status: r.status,
        count: r._count.status,
    })));

    // Get upcoming holidays (next 5) - TODO: Implement when holiday model is available
    const upcomingHolidays: UpcomingHoliday[] = [];

    return {
        totalEmployees,
        presentToday: presentToday + halfDayToday,
        absentToday,
        onLeaveToday,
        pendingLeaves,
        recentJoiners,
        leaveDistribution,
        upcomingHolidays,
    };
}

/**
 * Get employee dashboard statistics
 */
export async function getEmployeeStats(employeeId: string): Promise<EmployeeStatsResponseDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get attendance summary (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const attendanceRecords = await prisma.attendance.groupBy({
        by: ['status'],
        where: {
            employeeId,
            date: {
                gte: thirtyDaysAgo,
            },
        },
        _count: {
            status: true,
        },
    });

    const present = attendanceRecords.find(a => a.status === AttendanceType.PRESENT)?._count.status || 0;
    const halfDay = attendanceRecords.find(a => a.status === AttendanceType.HALF_DAY)?._count.status || 0;
    const absent = attendanceRecords.find(a => a.status === AttendanceType.ABSENT)?._count.status || 0;

    // Get leave balance (assuming 20 days annual leave)
    const usedLeaves = await prisma.leaveRequest.count({
        where: {
            employeeId,
            status: LeaveStatus.APPROVED,
        },
    });

    const totalLeaves = 20; // This should come from company policy
    const remainingLeaves = totalLeaves - usedLeaves;

    // Get pending leave requests
    const pendingRequests = await prisma.leaveRequest.count({
        where: {
            employeeId,
            status: LeaveStatus.PENDING,
        },
    });

    // Get recent attendance (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentAttendance: RecentAttendance[] = await prisma.attendance.findMany({
        where: {
            employeeId,
            date: {
                gte: sevenDaysAgo,
            },
        },
        select: {
            date: true,
            status: true,
            firstCheckIn: true,
            lastCheckOut: true,
        },
        orderBy: {
            date: 'desc',
        },
        take: 7,
    }).then(records => records.map(r => ({
        date: r.date,
        type: r.status,
        checkIn: r.firstCheckIn || undefined,
        checkOut: r.lastCheckOut || undefined,
    })));

    // Get upcoming holidays - TODO: Implement when holiday model is available
    const upcomingHolidays: UpcomingHoliday[] = [];

    return {
        attendanceSummary: {
            present,
            absent,
            halfDay,
            total: present + absent + halfDay,
        },
        leaveBalance: {
            total: totalLeaves,
            used: usedLeaves,
            remaining: remainingLeaves,
        },
        pendingRequests,
        recentAttendance,
        upcomingHolidays,
    };
}
