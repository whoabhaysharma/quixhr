import api from '../api';
import { ApiResponse, ApiError } from '@/types/api';

export interface AdminStats {
    totalEmployees: number;
    pendingLeaves: number;
    presentToday: number;
    absentToday: number;
    onLeaveToday: number;
    recentJoiners: Array<{
        id: string;
        name: string;
        email: string;
        joinedAt: string;
        avatar?: string | null;
    }>;
    upcomingHolidays: Array<{
        id: string;
        name: string;
        date: string;
        description?: string;
    }>;
    leaveDistribution: Array<{
        name: string;
        value: number;
    }>;
    pendingLeaveRequests: Array<{
        id: string;
        type: string;
        startDate: string;
        endDate: string;
        reason: string;
        createdAt: string;
        employee: {
            id: string;
            firstName: string;
            lastName: string;
            avatar: string | null;
        }
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
    pendingRequests: number;
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
    // Get dashboard statistics (Role based)
    getStats: async (): Promise<ApiResponse<AdminStats | EmployeeStats>> => {
        try {
            const response = await api.get<ApiResponse<AdminStats | EmployeeStats>>('/dashboard/stats');
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to fetch dashboard stats',
                error.response?.data?.status || 'fail',
                error.response?.status
            );
        }
    },

    // Legacy support or specific if needed (deprecated)
    getAdminStats: async (companyId?: string): Promise<ApiResponse<AdminStats>> => {
        try {
            const response = await api.get<ApiResponse<AdminStats>>('/dashboard/stats');
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to fetch admin stats',
                error.response?.data?.status || 'fail',
                error.response?.status
            );
        }
    },

    // Get employee dashboard statistics
    getEmployeeStats: async (): Promise<ApiResponse<EmployeeStats>> => {
        try {
            const response = await api.get<ApiResponse<EmployeeStats>>('/dashboard/stats');
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to fetch employee stats',
                error.response?.data?.status || 'fail',
                error.response?.status
            );
        }
    },
};
