import prisma from '@/utils/prisma';
import { AppError } from '@/utils/appError';
import { PunchDTO, MonthlySummary, DailyReportFilters, RegularizeAttendanceDTO, BulkSyncDTO } from './attendance.types';
import { AttendanceStatus } from '@prisma/client';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, differenceInMinutes } from 'date-fns';

/**
 * Clock In / Clock Out
 */
export const punch = async (userId: string, data: PunchDTO) => {
    // Get employee record
    const employee = await prisma.employee.findFirst({
        where: { userId },
        include: { calendar: true },
    });

    if (!employee) {
        throw new AppError('Employee profile not found', 404);
    }

    const today = startOfDay(new Date());
    const now = new Date();

    // Get or create today's attendance record
    let attendance = await prisma.attendance.findFirst({
        where: {
            employeeId: employee.id,
            date: today,
        },
        include: {
            logs: {
                orderBy: { timestamp: 'desc' },
            },
        },
    });

    if (data.type === 'IN') {
        // Clock In Logic
        if (attendance?.checkIn) {
            throw new AppError('You have already clocked in today', 400);
        }

        if (!attendance) {
            // Create new attendance record
            attendance = await prisma.attendance.create({
                data: {
                    employeeId: employee.id,
                    date: today,
                    status: AttendanceStatus.PRESENT,
                    checkIn: now,
                },
                include: { logs: true },
            });
        } else {
            // Update existing record
            attendance = await prisma.attendance.update({
                where: { id: attendance.id },
                data: {
                    checkIn: now,
                    status: AttendanceStatus.PRESENT,
                },
                include: { logs: true },
            });
        }

        // Create punch log
        await prisma.attendanceLog.create({
            data: {
                attendanceId: attendance.id,
                timestamp: now,
                type: 'IN',
                method: data.method || 'WEB',
                gpsCoords: data.gpsCoords,
            },
        });

        // Check if late (if calendar exists)
        if (employee.calendar) {
            const expectedStartMinutes = employee.calendar.dayStartTime;
            const currentMinutes = now.getHours() * 60 + now.getMinutes();

            if (currentMinutes > expectedStartMinutes + 15) { // 15 min grace period
                await prisma.attendance.update({
                    where: { id: attendance.id },
                    data: { isLate: true },
                });
            }
        }
    } else {
        // Clock Out Logic
        if (!attendance || !attendance.checkIn) {
            throw new AppError('You must clock in before clocking out', 400);
        }

        if (attendance.checkOut) {
            throw new AppError('You have already clocked out today', 400);
        }

        // Calculate work minutes
        const workMinutes = differenceInMinutes(now, attendance.checkIn);

        // Update attendance
        attendance = await prisma.attendance.update({
            where: { id: attendance.id },
            data: {
                checkOut: now,
                workMinutes,
            },
            include: { logs: true },
        });

        // Create punch log
        await prisma.attendanceLog.create({
            data: {
                attendanceId: attendance.id,
                timestamp: now,
                type: 'OUT',
                method: data.method || 'WEB',
                gpsCoords: data.gpsCoords,
            },
        });

        // Check if early out
        if (employee.calendar) {
            const expectedEndMinutes = employee.calendar.dayEndTime;
            const currentMinutes = now.getHours() * 60 + now.getMinutes();

            if (currentMinutes < expectedEndMinutes - 15) { // 15 min grace period
                await prisma.attendance.update({
                    where: { id: attendance.id },
                    data: { isEarlyOut: true },
                });
            }
        }
    }

    return attendance;
};

/**
 * Get monthly summary for employee
 */
export const getMySummary = async (userId: string, month?: number, year?: number): Promise<MonthlySummary> => {
    const employee = await prisma.employee.findFirst({
        where: { userId },
    });

    if (!employee) {
        throw new AppError('Employee profile not found', 404);
    }

    const now = new Date();
    const targetMonth = month || now.getMonth() + 1;
    const targetYear = year || now.getFullYear();

    const startDate = startOfMonth(new Date(targetYear, targetMonth - 1));
    const endDate = endOfMonth(new Date(targetYear, targetMonth - 1));

    // Get all attendance records for the month
    const attendances = await prisma.attendance.findMany({
        where: {
            employeeId: employee.id,
            date: {
                gte: startDate,
                lte: endDate,
            },
        },
    });

    // Calculate summary
    const summary: MonthlySummary = {
        month: targetMonth,
        year: targetYear,
        totalDays: attendances.length,
        presentDays: attendances.filter(a => a.status === AttendanceStatus.PRESENT).length,
        absentDays: attendances.filter(a => a.status === AttendanceStatus.ABSENT).length,
        lateDays: attendances.filter(a => a.isLate).length,
        halfDays: attendances.filter(a => a.status === AttendanceStatus.HALF_DAY).length,
        onLeaveDays: attendances.filter(a => a.status === AttendanceStatus.ON_LEAVE).length,
        holidayDays: attendances.filter(a => a.status === AttendanceStatus.HOLIDAY).length,
    };

    return summary;
};

/**
 * Get daily attendance report
 */
export const getDailyReport = async (companyId: string | undefined, filters: DailyReportFilters) => {
    const targetDate = filters.date ? new Date(filters.date) : new Date();
    const dayStart = startOfDay(targetDate);
    const dayEnd = endOfDay(targetDate);

    const where: any = {
        date: {
            gte: dayStart,
            lte: dayEnd,
        },
        employee: companyId ? { companyId } : undefined,
    };

    if (filters.status) {
        where.status = filters.status;
    }

    const attendances = await prisma.attendance.findMany({
        where,
        include: {
            employee: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    code: true,
                    user: {
                        select: {
                            email: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            checkIn: 'asc',
        },
    });

    return {
        date: targetDate.toISOString().split('T')[0],
        total: attendances.length,
        attendances,
    };
};

/**
 * Get raw punch logs for an attendance record
 */
export const getAttendanceLogs = async (attendanceId: string, companyId: string | undefined) => {
    const where: any = { id: attendanceId };

    if (companyId) {
        where.employee = { companyId };
    }

    const attendance = await prisma.attendance.findFirst({
        where,
        include: {
            employee: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    code: true,
                },
            },
            logs: {
                orderBy: { timestamp: 'asc' },
            },
        },
    });

    if (!attendance) {
        throw new AppError('Attendance record not found', 404);
    }

    return attendance;
};

/**
 * Regularize attendance (Manager/Admin can fix attendance)
 */
export const regularizeAttendance = async (companyId: string, data: RegularizeAttendanceDTO) => {
    // Verify employee belongs to company
    const employee = await prisma.employee.findFirst({
        where: {
            id: data.employeeId,
            companyId,
        },
    });

    if (!employee) {
        throw new AppError('Employee not found in this company', 404);
    }

    const targetDate = startOfDay(new Date(data.date));

    // Get or create attendance record
    let attendance = await prisma.attendance.findFirst({
        where: {
            employeeId: employee.id,
            date: targetDate,
        },
    });

    const updateData: any = {
        status: data.status,
    };

    if (data.checkIn) {
        updateData.checkIn = new Date(data.checkIn);
    }

    if (data.checkOut) {
        updateData.checkOut = new Date(data.checkOut);
    }

    // Calculate work minutes if both times provided
    if (updateData.checkIn && updateData.checkOut) {
        updateData.workMinutes = differenceInMinutes(updateData.checkOut, updateData.checkIn);
    }

    if (attendance) {
        // Update existing record
        attendance = await prisma.attendance.update({
            where: { id: attendance.id },
            data: updateData,
        });
    } else {
        // Create new record
        attendance = await prisma.attendance.create({
            data: {
                employeeId: employee.id,
                date: targetDate,
                ...updateData,
            },
        });
    }

    // Create audit log entry
    await prisma.attendanceLog.create({
        data: {
            attendanceId: attendance.id,
            timestamp: new Date(),
            type: 'IN',
            method: `REGULARIZED: ${data.reason}`,
        },
    });

    return attendance;
};

/**
 * Bulk sync from biometric system
 */
export const bulkSync = async (data: BulkSyncDTO) => {
    const results = {
        success: [] as any[],
        failed: [] as any[],
    };

    for (const record of data.records) {
        try {
            // Find employee by code
            const employee = await prisma.employee.findFirst({
                where: { code: record.employeeCode },
            });

            if (!employee) {
                results.failed.push({
                    employeeCode: record.employeeCode,
                    reason: 'Employee not found',
                });
                continue;
            }

            const timestamp = new Date(record.timestamp);
            const dayStart = startOfDay(timestamp);

            // Get or create attendance record
            let attendance = await prisma.attendance.findFirst({
                where: {
                    employeeId: employee.id,
                    date: dayStart,
                },
            });

            if (!attendance) {
                attendance = await prisma.attendance.create({
                    data: {
                        employeeId: employee.id,
                        date: dayStart,
                        status: AttendanceStatus.PRESENT,
                    },
                });
            }

            // Update check-in or check-out
            if (record.type === 'IN' && !attendance.checkIn) {
                await prisma.attendance.update({
                    where: { id: attendance.id },
                    data: { checkIn: timestamp },
                });
            } else if (record.type === 'OUT') {
                const updateData: any = { checkOut: timestamp };

                if (attendance.checkIn) {
                    updateData.workMinutes = differenceInMinutes(timestamp, attendance.checkIn);
                }

                await prisma.attendance.update({
                    where: { id: attendance.id },
                    data: updateData,
                });
            }

            // Create log entry
            await prisma.attendanceLog.create({
                data: {
                    attendanceId: attendance.id,
                    timestamp,
                    type: record.type,
                    method: `BIOMETRIC:${record.deviceId || 'UNKNOWN'}`,
                },
            });

            results.success.push({
                employeeCode: record.employeeCode,
                timestamp: record.timestamp,
            });
        } catch (error: any) {
            results.failed.push({
                employeeCode: record.employeeCode,
                reason: error.message || 'Unknown error',
            });
        }
    }

    return results;
};
