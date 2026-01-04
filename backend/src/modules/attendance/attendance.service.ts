import { prisma } from '@/utils/prisma';
import { AttendanceStatus, Role } from '@prisma/client';
import { AppError } from '@/utils/appError';
import { ParsedPagination } from '@/utils/pagination';
import { buildOrderBy, validateOrganizationResource } from '@/utils/prismaHelpers';
import {
    ClockInInput,
    ClockOutInput,
    GetAttendanceQuery,
    ManualEntryInput
} from './attendance.schema';

export class AttendanceService {

    /**
     * Clock In Logic
     */
    static async clockIn(
        organizationId: string,
        employeeId: string,
        data: ClockInInput
    ) {
        // Validate Employee belongs to Organization
        await validateOrganizationResource('employee', employeeId, organizationId, 'Employee');

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if already clocked in
        const existing = await prisma.attendance.findUnique({
            where: {
                employeeId_date: {
                    employeeId,
                    date: today
                }
            }
        });

        if (existing && existing.checkIn) {
            throw new AppError('Already clocked in for today', 400);
        }

        const now = new Date();
        // TODO: Late logic based on calendar linked to employee

        return await prisma.$transaction(async (tx) => {
            const attendance = await tx.attendance.upsert({
                where: {
                    employeeId_date: {
                        employeeId,
                        date: today
                    }
                },
                update: {
                    checkIn: now,
                    status: AttendanceStatus.PRESENT
                },
                create: {
                    employeeId,
                    date: today,
                    status: AttendanceStatus.PRESENT,
                    checkIn: now,
                    isLate: false // Placeholder
                }
            });

            await tx.attendanceLog.create({
                data: {
                    attendanceId: attendance.id,
                    timestamp: now,
                    type: 'IN',
                    method: data.method,
                    gpsCoords: data.gpsCoords ? (data.gpsCoords as any) : undefined
                }
            });

            return attendance;
        });
    }

    /**
     * Clock Out Logic
     */
    static async clockOut(
        organizationId: string,
        employeeId: string,
        data: ClockOutInput
    ) {
        await validateOrganizationResource('employee', employeeId, organizationId, 'Employee');

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendance = await prisma.attendance.findUnique({
            where: {
                employeeId_date: { employeeId, date: today }
            }
        });

        if (!attendance || !attendance.checkIn) {
            throw new AppError('No check-in record found for today. Please clock in first.', 400);
        }

        const now = new Date();
        const workMinutes = Math.floor((now.getTime() - attendance.checkIn.getTime()) / 60000);

        return await prisma.$transaction(async (tx) => {
            const updated = await tx.attendance.update({
                where: { id: attendance.id },
                data: {
                    checkOut: now,
                    workMinutes, // Simple accumulated calculation?
                    // Should theoretically add to previous workMinutes if multiple sessions allowed
                    // But for simple IN/OUT model, this replaces.
                }
            });

            await tx.attendanceLog.create({
                data: {
                    attendanceId: attendance.id,
                    timestamp: now,
                    type: 'OUT',
                    method: data.method,
                    gpsCoords: data.gpsCoords ? (data.gpsCoords as any) : undefined
                }
            });

            return updated;
        });
    }

    /**
     * Get Daily Logs (Detail View)
     */
    static async getDailyLogs(organizationId: string, employeeId: string, date: Date) {
        await validateOrganizationResource('employee', employeeId, organizationId, 'Employee');

        const queryDate = new Date(date);
        queryDate.setHours(0, 0, 0, 0);

        return await prisma.attendance.findUnique({
            where: {
                employeeId_date: { employeeId, date: queryDate }
            },
            include: {
                logs: { orderBy: { timestamp: 'asc' } }
            }
        });
    }

    /**
     * Admin/Manager List View
     */
    static async getAttendance(
        organizationId: string,
        query: ParsedPagination,
        filters: GetAttendanceQuery
    ) {
        const { page, limit, skip, sortBy, sortOrder } = query;
        const { employeeId, status, date, startDate, endDate, month, year } = filters;

        const where: any = {
            employee: { organizationId } // Explicit scoping via relation
        };

        if (employeeId) where.employeeId = employeeId;
        if (status) where.status = status;

        // Date Filtering
        if (date) {
            const d = new Date(date);
            d.setHours(0, 0, 0, 0);
            where.date = d;
        } else if (startDate && endDate) {
            where.date = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        } else if (month && year) {
            const start = new Date(year, month - 1, 1);
            const end = new Date(year, month, 0);
            where.date = { gte: start, lte: end };
        }

        const orderBy = buildOrderBy(sortBy, sortOrder, {
            allowedFields: ['date', 'status', 'checkIn', 'checkOut', 'workMinutes'],
            defaultSort: { date: 'desc' }
        });

        const [data, total] = await Promise.all([
            prisma.attendance.findMany({
                where,
                skip,
                take: limit,
                orderBy: orderBy as any,
                include: {
                    employee: { select: { firstName: true, lastName: true, code: true } }
                }
            }),
            prisma.attendance.count({ where })
        ]);

        return {
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Get Attendance Across All Organizations (Super Admin)
     */
    static async getAttendanceAllOrgs(
        query: ParsedPagination,
        filters: GetAttendanceQuery
    ) {
        const { page, limit, skip, sortBy, sortOrder } = query;
        const { employeeId, status, date, startDate, endDate, month, year } = filters;

        const where: any = {};

        if (employeeId) where.employeeId = employeeId;
        if (status) where.status = status;

        // Date Filtering
        if (date) {
            const d = new Date(date);
            d.setHours(0, 0, 0, 0);
            where.date = d;
        } else if (startDate && endDate) {
            where.date = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        } else if (month && year) {
            const start = new Date(year, month - 1, 1);
            const end = new Date(year, month, 0);
            where.date = { gte: start, lte: end };
        }

        const orderBy = buildOrderBy(sortBy, sortOrder, {
            allowedFields: ['date', 'status', 'checkIn', 'checkOut', 'workMinutes'],
            defaultSort: { date: 'desc' }
        });

        const [data, total] = await Promise.all([
            prisma.attendance.findMany({
                where,
                skip,
                take: limit,
                orderBy: orderBy as any,
                include: {
                    employee: {
                        select: {
                            firstName: true,
                            lastName: true,
                            code: true,
                            organizationId: true,
                            organization: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    }
                }
            }),
            prisma.attendance.count({ where })
        ]);

        return {
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    /**
     * Manual Entry (Admin/Manager)
     */
    static async createManualAttendance(
        organizationId: string,
        data: ManualEntryInput,
        requesterRole: Role,
        requesterId: string // Used for Manager verification
    ) {
        // 1. Verify Employee exists in Organization
        await validateOrganizationResource('employee', data.employeeId, organizationId, 'Employee');

        // 2. Strict RBAC: Manager can only clock for their direct reports
        if (requesterRole === Role.MANAGER) {
            const subordinate = await prisma.employee.findFirst({
                where: {
                    id: data.employeeId,
                    organizationId,
                    managerId: requesterId
                }
            });
            if (!subordinate) {
                throw new AppError('You can only manage attendance for your direct reports', 403);
            }
        }

        // 3. Check for duplicates
        const existing = await prisma.attendance.findUnique({
            where: {
                employeeId_date: {
                    employeeId: data.employeeId,
                    date: new Date(data.date)
                }
            }
        });

        if (existing) {
            throw new AppError('Attendance record already exists for this date', 400);
        }

        const date = new Date(data.date);
        date.setHours(0, 0, 0, 0);

        // Calculate workMinutes if both times provided
        let workMinutes = 0;
        if (data.checkIn && data.checkOut) {
            workMinutes = Math.floor((new Date(data.checkOut).getTime() - new Date(data.checkIn).getTime()) / 60000);
        }

        return await prisma.$transaction(async (tx) => {
            const attendance = await tx.attendance.create({
                data: {
                    employeeId: data.employeeId,
                    date,
                    status: data.status || AttendanceStatus.PRESENT,
                    checkIn: new Date(data.checkIn),
                    checkOut: data.checkOut ? new Date(data.checkOut) : null,
                    workMinutes
                }
            });

            await tx.attendanceLog.create({
                data: {
                    attendanceId: attendance.id,
                    timestamp: new Date(),
                    type: 'MANUAL',
                    method: 'MANUAL_ENTRY',
                    metadata: {
                        createdBy: requesterId,
                        role: requesterRole,
                        remarks: data.remarks // Store remarks in metadata instead
                    }
                }
            });

            return attendance;
        });
    }

    /**
     * Update Attendance (Admin/Manager)
     */
    static async updateAttendance(
        attendanceId: string,
        organizationId: string,
        data: Partial<ManualEntryInput>,
        requesterRole: Role,
        requesterId: string
    ) {
        const attendance = await prisma.attendance.findUnique({
            where: { id: attendanceId },
            include: { employee: true }
        });

        if (!attendance) throw new AppError('Attendance record not found', 404);
        if (attendance.employee.organizationId !== organizationId) throw new AppError('Access denied', 403);

        // RBAC: Manager check
        if (requesterRole === Role.MANAGER) {
            if (attendance.employee.managerId !== requesterId) {
                throw new AppError('You can only manage attendance for your direct reports', 403);
            }
        }

        const updateData: any = {};
        if (data.status) updateData.status = data.status;
        if (data.checkIn) updateData.checkIn = new Date(data.checkIn);
        if (data.checkOut) updateData.checkOut = new Date(data.checkOut);

        // Recalculate workMinutes if times change
        const newCheckIn = updateData.checkIn ? new Date(updateData.checkIn) : attendance.checkIn;
        const newCheckOut = updateData.checkOut ? new Date(updateData.checkOut) : attendance.checkOut;

        if (newCheckIn && newCheckOut) {
            updateData.workMinutes = Math.floor((newCheckOut.getTime() - newCheckIn.getTime()) / 60000);
        } else if (newCheckIn && !newCheckOut) {
            updateData.workMinutes = 0; // Reset if checkout removed
        }

        return await prisma.$transaction(async (tx) => {
            const updated = await tx.attendance.update({
                where: { id: attendanceId },
                data: updateData
            });

            await tx.attendanceLog.create({
                data: {
                    attendanceId: attendance.id,
                    timestamp: new Date(),
                    type: 'MANUAL', // Or 'UPDATE' if supported enum
                    method: 'MANUAL_UPDATE',
                    metadata: {
                        updatedBy: requesterId,
                        role: requesterRole,
                        changes: updateData,
                        remarks: data.remarks // Store remarks in metadata
                    }
                }
            });

            return updated;
        });
    }
}
