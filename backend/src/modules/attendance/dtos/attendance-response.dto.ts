import { AttendanceStatus } from '@prisma/client';
import { UserSummaryDto } from '../users/dtos/user-summary.dto';

/**
 * Attendance record response
 */
export interface AttendanceResponseDto {
    id: string;
    userId: string;
    date: Date;
    clockIn: Date | null;
    clockOut: Date | null;
    status: AttendanceStatus;
    createdAt: Date;
    updatedAt: Date;
    user?: UserSummaryDto;
}

/**
 * Transform database Attendance model to response DTO
 */
export function toAttendanceResponseDto(attendance: {
    id: string;
    userId: string;
    date: Date;
    clockIn: Date | null;
    clockOut: Date | null;
    status: AttendanceStatus;
    createdAt: Date;
    updatedAt: Date;
    user?: {
        id: string;
        name: string | null;
        email: string;
        avatar: string | null;
        role: any;
    };
}): AttendanceResponseDto {
    return {
        id: attendance.id,
        userId: attendance.userId,
        date: attendance.date,
        clockIn: attendance.clockIn,
        clockOut: attendance.clockOut,
        status: attendance.status,
        createdAt: attendance.createdAt,
        updatedAt: attendance.updatedAt,
        user: attendance.user ? {
            id: attendance.user.id,
            name: attendance.user.name,
            email: attendance.user.email,
            avatar: attendance.user.avatar,
            role: attendance.user.role,
        } : undefined,
    };
}
