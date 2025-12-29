import { AttendanceStatus } from '@prisma/client';

export interface PunchDTO {
    type: 'IN' | 'OUT';
    method?: string;  // 'WEB', 'MOBILE', 'BIOMETRIC'
    gpsCoords?: {
        latitude: number;
        longitude: number;
    };
}

export interface MonthlySummary {
    month: number;
    year: number;
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    halfDays: number;
    onLeaveDays: number;
    holidayDays: number;
}

export interface DailyReportFilters {
    date?: string;
    status?: AttendanceStatus;
}

export interface RegularizeAttendanceDTO {
    employeeId: string;
    date: string;
    status: AttendanceStatus;
    checkIn?: string;
    checkOut?: string;
    reason: string;
}

export interface BulkSyncDTO {
    records: Array<{
        employeeCode: string;
        timestamp: string;
        type: 'IN' | 'OUT';
        deviceId?: string;
    }>;
}
