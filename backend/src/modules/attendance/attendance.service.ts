import { prisma } from '@/utils/prisma';
import { AttendanceStatus } from '@prisma/client';
import { CreateAttendanceInput, UpdateAttendanceInput, AttendanceLogInput } from './attendance.types';

export const clockIn = async (employeeId: string, gpsCoords?: any, method: string = 'WEB') => {
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
        throw new Error('Already clocked in for today');
    }

    // Determine status logic (e.g. Late?) - simplified for now
    const now = new Date();
    let isLate = false;
    // TODO: Compare with Calendar start time

    const data: CreateAttendanceInput = {
        employeeId,
        date: today,
        status: AttendanceStatus.PRESENT,
        checkIn: now,
        isLate
    };

    // Upsert attendance record
    const attendance = await prisma.attendance.upsert({
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
        create: data
    });

    // Create Log
    await prisma.attendanceLog.create({
        data: {
            attendanceId: attendance.id,
            timestamp: now,
            type: 'IN',
            method,
            gpsCoords: gpsCoords ?? undefined
        }
    });

    return attendance;
};

export const clockOut = async (employeeId: string, gpsCoords?: any, method: string = 'WEB') => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await prisma.attendance.findUnique({
        where: {
            employeeId_date: {
                employeeId,
                date: today
            }
        }
    });

    if (!attendance) {
        throw new Error('No attendance record found for today. Please clock in first.');
    }

    if (attendance.checkOut) {
        // Allow multiple clock outs? Usually just update the last one.
        // For simplicity, we update it.
    }

    const now = new Date();

    // Calculate work duration
    const checkIn = attendance.checkIn!;
    const diffMs = now.getTime() - checkIn.getTime();
    const workMinutes = Math.floor(diffMs / 60000);

    // Update Attendance
    const updated = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
            checkOut: now,
            workMinutes
            // TODO: Calculate Early Out / Overtime based on Calendar
        }
    });

    // Create Log
    await prisma.attendanceLog.create({
        data: {
            attendanceId: attendance.id,
            timestamp: now,
            type: 'OUT',
            method,
            gpsCoords: gpsCoords ?? undefined
        }
    });

    return updated;
};

export const getDailyLogs = async (employeeId: string, date: Date) => {
    // Ensure date is start of day
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const attendance = await prisma.attendance.findUnique({
        where: {
            employeeId_date: {
                employeeId,
                date: start
            }
        },
        include: {
            logs: {
                orderBy: { timestamp: 'asc' }
            }
        }
    });

    return attendance;
};

export const getMonthlySummary = async (employeeId: string, month: number, year: number) => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const records = await prisma.attendance.findMany({
        where: {
            employeeId,
            date: {
                gte: startDate,
                lte: endDate
            }
        },
        orderBy: { date: 'asc' }
    });

    return records;
};
