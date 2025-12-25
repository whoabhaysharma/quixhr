import { PrismaClient } from "@prisma/client";
import { startOfDay } from "date-fns";

const prisma = new PrismaClient();

export const clockIn = async (userId: string) => {
    const today = startOfDay(new Date());

    // Check if already clocked in today
    const existingAttendance = await prisma.attendance.findUnique({
        where: {
            userId_date: {
                userId,
                date: today,
            },
        },
    });

    if (existingAttendance) {
        throw new Error("Already clocked in for today.");
    }

    return await prisma.attendance.create({
        data: {
            userId,
            date: today,
            clockIn: new Date(),
        },
    });
};

export const clockOut = async (userId: string) => {
    const today = startOfDay(new Date());

    const existingAttendance = await prisma.attendance.findUnique({
        where: {
            userId_date: {
                userId,
                date: today,
            },
        },
    });

    if (!existingAttendance) {
        throw new Error("No attendance record found for today. Please clock in first.");
    }

    return await prisma.attendance.update({
        where: {
            id: existingAttendance.id,
        },
        data: {
            clockOut: new Date(),
        },
    });
};

export const getMyAttendance = async (userId: string) => {
    return await prisma.attendance.findMany({
        where: {
            userId,
        },
        orderBy: {
            date: "desc",
        },
    });
};

export const getTodayStatus = async (userId: string) => {
    const today = startOfDay(new Date());

    return await prisma.attendance.findUnique({
        where: {
            userId_date: {
                userId,
                date: today,
            },
        },
    });
};

export const markAttendance = async (
    userId: string,
    date: Date,
    status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'OFF' | 'LEAVE',
    clockIn?: Date,
    clockOut?: Date
) => {
    const targetDate = startOfDay(new Date(date));

    // Upsert acts as "Mark or Update"
    return await prisma.attendance.upsert({
        where: {
            userId_date: {
                userId,
                date: targetDate,
            },
        },
        update: {
            status,
            clockIn,
            clockOut,
        },
        create: {
            userId,
            date: targetDate,
            status,
            clockIn,
            clockOut,
        },
    });
};

export const getAllAttendance = async () => {
    return await prisma.attendance.findMany({
        orderBy: {
            date: "desc",
        },
        include: {
            user: {
                select: {
                    name: true,
                    email: true,
                },
            },
        },
    });
};
