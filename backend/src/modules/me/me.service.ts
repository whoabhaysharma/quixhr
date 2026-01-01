import { prisma } from '@/utils/prisma';
import { AppError } from '@/utils/appError';
import {
    AuthContext,
    EmployeeContext
} from './me.types';
import {
    UpdateUserProfileRequestDto,
    CheckInRequestDto,
    CheckOutRequestDto,
    CompleteProfileResponseDto,
    CompanyProfileResponseDto,
    UserProfileResponseDto,
    EmployeeProfileResponseDto,
    MyLeavesResponseDto,
    MyLeaveBalanceResponseDto,
    MyLeaveLedgerResponseDto,
    MyLeaveRequestsResponseDto,
    MyAttendanceResponseDto,
    CheckInOutResponseDto,
    NotificationsListResponseDto,
    AuditLogsListResponseDto
} from './me.schema';

export class MeService {
    /**
     * Get employee context for the authenticated user
     */
    static async getEmployeeContext(userId: string): Promise<EmployeeContext> {
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
    }

    /**
     * Get complete user profile
     */
    static async getCompleteProfile(userId: string): Promise<CompleteProfileResponseDto> {
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
    }

    /**
     * Update user profile
     */
    static async updateUserProfile(userId: string, data: UpdateUserProfileRequestDto) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        // If email is being updated, check for duplicates
        if (data.email && data.email !== user.email) {
            const existingUser = await prisma.user.findUnique({
                where: { email: data.email },
            });

            if (existingUser) {
                throw new AppError('Email already in use', 400);
            }
        }

        await prisma.user.update({
            where: { id: userId },
            data,
        });

        return this.getCompleteProfile(userId);
    }

    /**
     * Get my leave policies
     */
    static async getMyLeaves(userId: string): Promise<MyLeavesResponseDto> {
        const employee = await this.getEmployeeContext(userId);

        if (!employee.leaveGradeId) {
            throw new AppError('Employee has no leave grade assigned', 404);
        }

        const grade = await prisma.leaveGrade.findUnique({
            where: { id: employee.leaveGradeId },
            include: {
                policies: true,
            },
        });

        if (!grade) {
            throw new AppError('Leave grade not found', 404);
        }

        return {
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
    }

    /**
     * Get my leave balance
     */
    static async getMyLeaveBalance(userId: string): Promise<MyLeaveBalanceResponseDto> {
        const employee = await this.getEmployeeContext(userId);
        const currentYear = new Date().getFullYear();

        const allocations = await prisma.leaveAllocation.findMany({
            where: {
                employeeId: employee.id,
                year: currentYear,
            },
        });

        return {
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
    }

    /**
     * Get my leave ledger
     */
    static async getMyLeaveLedger(userId: string, page: number = 1, limit: number = 20): Promise<MyLeaveLedgerResponseDto> {
        const employee = await this.getEmployeeContext(userId);
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

        return {
            entries: entries.map((entry) => ({
                id: entry.id,
                createdAt: entry.createdAt,
                event: entry.event.toString(),
                amount: entry.amount,
                remarks: entry.remarks || undefined,
                leaveRequestId: entry.leaveRequestId || undefined,
            })),
            total,
        };
    }

    /**
     * Get my leave requests
     */
    static async getMyLeaveRequests(userId: string, status?: string, page: number = 1, limit: number = 20): Promise<MyLeaveRequestsResponseDto> {
        const employee = await this.getEmployeeContext(userId);
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

        return {
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
    }

    /**
     * Create leave request
     */
    static async createLeaveRequest(userId: string, data: any) {
        const employee = await this.getEmployeeContext(userId);
        const { startDate, endDate, type, reason, dayDetails } = data;

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start > end) {
            throw new AppError('Start date must be before end date', 400);
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

        return {
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
    }

    /**
     * Check in
     */
    static async checkIn(userId: string, data: CheckInRequestDto): Promise<CheckInOutResponseDto> {
        const employee = await this.getEmployeeContext(userId);
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
            attendance = await prisma.attendance.create({
                data: {
                    employeeId: employee.id,
                    date: today,
                    status: 'PRESENT',
                    checkIn: checkInTime,
                },
            });
        } else {
            attendance = await prisma.attendance.update({
                where: { id: attendance.id },
                data: {
                    checkIn: checkInTime,
                    status: 'PRESENT',
                },
            });
        }

        await prisma.attendanceLog.create({
            data: {
                attendanceId: attendance.id,
                timestamp: checkInTime,
                type: 'IN',
                method: data.method,
                gpsCoords: data.gpsCoords,
            },
        });

        return {
            id: attendance.id,
            date: attendance.date,
            status: attendance.status as any,
            checkIn: attendance.checkIn || undefined,
            checkOut: attendance.checkOut || undefined,
            workMinutes: attendance.workMinutes,
            isLate: attendance.isLate,
        };
    }

    /**
     * Check out
     */
    static async checkOut(userId: string, data: CheckOutRequestDto): Promise<CheckInOutResponseDto> {
        const employee = await this.getEmployeeContext(userId);
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
            throw new AppError('No check-in found for today. Please check in first.', 400);
        }

        const checkOutTime = new Date();
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

        await prisma.attendanceLog.create({
            data: {
                attendanceId: attendance.id,
                timestamp: checkOutTime,
                type: 'OUT',
                method: data.method,
                gpsCoords: data.gpsCoords,
            },
        });

        return {
            id: updatedAttendance.id,
            date: updatedAttendance.date,
            status: updatedAttendance.status as any,
            checkIn: updatedAttendance.checkIn || undefined,
            checkOut: updatedAttendance.checkOut || undefined,
            workMinutes: updatedAttendance.workMinutes,
            isLate: updatedAttendance.isLate,
        };
    }

    /**
     * Get my attendance
     */
    static async getMyAttendance(userId: string, page: number = 1, limit: number = 20): Promise<MyAttendanceResponseDto> {
        const employee = await this.getEmployeeContext(userId);
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

        return {
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
    }

    /**
     * Get notifications
     */
    static async getNotifications(userId: string, page: number = 1, limit: number = 10): Promise<NotificationsListResponseDto> {
        const skip = (page - 1) * limit;

        const [notifications, total] = await Promise.all([
            prisma.notification.findMany({
                where: { userId },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.notification.count({
                where: { userId },
            }),
        ]);

        const unreadCount = await prisma.notification.count({
            where: {
                userId,
                isRead: false,
            },
        });

        return {
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
    }

    /**
     * Mark notification as read
     */
    static async markNotificationAsRead(userId: string, notificationId: string) {
        const notification = await prisma.notification.findUnique({
            where: { id: notificationId },
        });

        if (!notification) {
            throw new AppError('Notification not found', 404);
        }

        if (notification.userId !== userId) {
            throw new AppError('Not authorized to update this notification', 403);
        }

        const updatedNotification = await prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true },
        });

        return updatedNotification;
    }

    /**
     * Get audit logs
     */
    static async getAuditLogs(userId: string, page: number = 1, limit: number = 10, action?: string, resource?: string): Promise<AuditLogsListResponseDto> {
        const skip = (page - 1) * limit;

        const whereClause: any = {
            userId,
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

        return {
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
    }
}
