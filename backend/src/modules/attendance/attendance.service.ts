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
            firstCheckIn: timestamp,
            status: AttendanceType.PRESENT,
            totalMinutes: 0
        }
    });

    // Get employee to send notification
    const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        select: { userId: true }
    });

    // Create notification for check-in
    if (employee?.userId) {
        const { notifyAttendance } = await import('../notification/notification.helper');
        await notifyAttendance.checkedIn(employee.userId, timestamp);
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

    if (attendance.lastCheckOut) {
        throw new Error('Already checked out.');
    }

    // Calculate total minutes
    const totalMinutes = attendance.firstCheckIn
        ? Math.floor((timestamp.getTime() - attendance.firstCheckIn.getTime()) / (1000 * 60))
        : 0;

    // Update checkout
    const updated = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
            lastCheckOut: timestamp,
            totalMinutes
        }
    });

    // Get employee to send notification
    const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        select: { userId: true }
    });

    // Calculate hours worked
    const hoursWorked = totalMinutes / 60;

    // Create notification for check-out
    if (employee?.userId && attendance.firstCheckIn) {
        const { notifyAttendance } = await import('../notification/notification.helper');
        await notifyAttendance.checkedOut(
            employee.userId,
            attendance.firstCheckIn,
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
