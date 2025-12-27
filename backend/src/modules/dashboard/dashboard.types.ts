import { z } from 'zod';

/**
 * Admin Dashboard Stats Response
 */
export interface AdminStatsResponseDto {
    totalEmployees: number;
    presentToday: number;
    absentToday: number;
    onLeaveToday: number;
    pendingLeaves: number;
    recentJoiners: RecentJoiner[];
    leaveDistribution: LeaveDistribution[];
    upcomingHolidays: UpcomingHoliday[];
}

export interface RecentJoiner {
    id: string;
    name: string;
    joinedAt: Date;
}

export interface LeaveDistribution {
    status: string;
    count: number;
}

export interface UpcomingHoliday {
    id: string;
    name: string;
    date: Date;
    description?: string;
}

/**
 * Employee Dashboard Stats Response
 */
export interface EmployeeStatsResponseDto {
    attendanceSummary: {
        present: number;
        absent: number;
        halfDay: number;
        total: number;
    };
    leaveBalance: {
        total: number;
        used: number;
        remaining: number;
    };
    recentAttendance: RecentAttendance[];
    upcomingHolidays: UpcomingHoliday[];
}

export interface RecentAttendance {
    date: Date;
    type: string;
    checkIn?: Date;
    checkOut?: Date;
}
