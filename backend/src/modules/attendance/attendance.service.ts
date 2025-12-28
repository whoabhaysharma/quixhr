import { PrismaClient, AttendanceType } from '@prisma/client';
import { CheckInDto, CheckOutDto, AttendanceResponseDto } from './attendance.types';
import * as calendarService from '../calendar/calendar.service';

const prisma = new PrismaClient();

/**
 * Check In
 */
export async function checkIn(employeeId: string, dto: CheckInDto): Promise<AttendanceResponseDto> {
    const timestamp = dto.date || new Date();

    // Normalize date to YYYY-MM-DD for uniqueness check
    // We store 'date' as midnight UTC or local? 
    // Usually 'date' field represents the "Day" of attendance.
    // Let's assume we strip time for the 'date' field.
    const dateOnly = new Date(timestamp);
    dateOnly.setHours(0, 0, 0, 0);

    // Check if already checked in for this date
    const existing = await prisma.attendance.findUnique({
        where: {
            employeeId_date: {
                employeeId,
                date: dateOnly
            }
        }
    });

    if (existing) {
        throw new Error('Attendance record already exists for this day.');
    }

    // Resolve Day Type (Working, Holiday, etc.)
    const { dayType } = await calendarService.resolveDay(employeeId, timestamp);

    const attendance = await prisma.attendance.create({
        data: {
            employeeId,
            date: dateOnly,
            checkIn: timestamp,
            attendanceType: AttendanceType.FULL,
            dayType: dayType
        },
        include: {
            employee: {
                select: {
                    userId: true,
                },
            },
        },
    });

    // Create notification for check-in
    if (attendance.employee?.userId) {
        const { notifyAttendance } = await import('../notification/notification.helper');
        await notifyAttendance.checkedIn(attendance.employee.userId, timestamp);
    }

    return attendance;
}

/**
 * Check Out
 */
export async function checkOut(employeeId: string, dto: CheckOutDto): Promise<AttendanceResponseDto> {
    const timestamp = dto.date || new Date();
    const dateOnly = new Date(timestamp);
    dateOnly.setHours(0, 0, 0, 0);

    const attendance = await prisma.attendance.findUnique({
        where: {
            employeeId_date: {
                employeeId,
                date: dateOnly
            }
        }
    });

    if (!attendance) {
        throw new Error('No check-in record found for this day.');
    }

    if (attendance.checkOut) {
        throw new Error('Already checked out.');
    }

    // Update checkout
    const updated = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
            checkOut: timestamp
            // Here logic could be added to calculate AttendanceType based on duration
        },
        include: {
            employee: {
                select: {
                    userId: true,
                },
            },
        },
    });

    // Calculate hours worked
    const hoursWorked = (timestamp.getTime() - attendance.checkIn.getTime()) / (1000 * 60 * 60);

    // Create notification for check-out
    if (updated.employee?.userId) {
        const { notifyAttendance } = await import('../notification/notification.helper');
        await notifyAttendance.checkedOut(
            updated.employee.userId,
            attendance.checkIn,
            timestamp,
            hoursWorked
        );
    }

    return updated;
}

/**
 * Get My Attendance
 */
export async function getEmployeeAttendance(employeeId: string, startDate?: Date, endDate?: Date): Promise<AttendanceResponseDto[]> {
    const where: any = { employeeId };

    if (startDate && endDate) {
        where.date = {
            gte: startDate,
            lte: endDate
        };
    }

    return prisma.attendance.findMany({
        where,
        orderBy: { date: 'desc' }
    });
}

/**
 * Get Today's Status
 */
export async function getTodayStatus(employeeId: string): Promise<AttendanceResponseDto | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return prisma.attendance.findUnique({
        where: {
            employeeId_date: {
                employeeId,
                date: today
            }
        }
    });
}
