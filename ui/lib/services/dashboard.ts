import api, { ApiResponse } from '../api';

export interface AdminStats {
    totalEmployees: number;
    presentToday: number;
    absentToday: number;
    onLeaveToday: number;
    pendingLeaves: number;
    recentJoiners: Array<{
        id: string;
        name: string;
        joinedAt: string;
    }>;
    leaveDistribution: Array<{
        status: string;
        count: number;
    }>;
    upcomingHolidays: Array<{
        id: string;
        name: string;
        date: string;
        description?: string;
    }>;
}

export interface EmployeeStats {
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
    recentAttendance: Array<{
        date: string;
        type: string;
        checkIn?: string;
        checkOut?: string;
    }>;
    upcomingHolidays: Array<{
        id: string;
        name: string;
        date: string;
        description?: string;
    }>;
}

export const dashboardService = {
    // Get admin dashboard statistics
    getAdminStats: async (): Promise<ApiResponse<AdminStats>> => {
        const response = await api.get('/dashboard/admin/stats');
        return response.data;
    },

    // Get employee dashboard statistics
    getEmployeeStats: async (): Promise<ApiResponse<EmployeeStats>> => {
        const response = await api.get('/dashboard/employee/stats');
        return response.data;
    },
};
