import { AttendanceStatus } from '@prisma/client';

export interface CreateAttendanceInput {
    employeeId: string;
    date: Date;
    status: AttendanceStatus;
    checkIn?: Date;
    isLate?: boolean;
}

export interface UpdateAttendanceInput {
    checkOut?: Date;
    workMinutes?: number;
    status?: AttendanceStatus;
    isEarlyOut?: boolean;
    overtimeMins?: number;
}

export interface AttendanceLogInput {
    attendanceId: string;
    timestamp: Date;
    type: 'IN' | 'OUT';
    method?: string;
    gpsCoords?: any;
}
