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

export interface AvailabilityData {
    dates: {
        date: string;
        dayName: string;
    }[];
    employees: {
        id: string;
        name: string;
        role: string;
        dept: string;
        avatar: string;
        availability: string[];
    }[];
}

// Get dashboard statistics (Role based)
// NOTE: This usually requires context to know IF we are acting as admin or employee.
// Ideally this refactoring implies the frontend knows "Who am I" and calls distinct methods.

export const dashboardService = {
    // Get Admin Stats
    getAdminStats: async (organizationId: string): Promise<ApiResponse<AdminStats>> => {
        try {
            const response = await api.get<ApiResponse<AdminStats>>(`/org/${organizationId}/dashboard/stats`);
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
            const response = await api.get<ApiResponse<EmployeeStats>>('/me/dashboard');
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to fetch employee stats',
                error.response?.data?.status || 'fail',
                error.response?.status
            );
        }
    },

    getAvailability: async (organizationId: string, startDate?: string, endDate?: string): Promise<AvailabilityData> => {
        try {
            const query = new URLSearchParams();
            if (startDate) query.append('startDate', startDate);
            if (endDate) query.append('endDate', endDate);

            const response = await api.get<ApiResponse<AvailabilityData>>(`/org/${organizationId}/dashboard/availability?${query.toString()}`);
            return response.data.data!;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to fetch availability',
                error.response?.data?.status || 'fail',
                error.response?.status
            );
        }
    },

    // Super Admin Stats
    getSuperAdminStats: async (): Promise<ApiResponse<any>> => {
        try {
            const response = await api.get<ApiResponse<any>>('/dashboard/stats');
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to fetch super admin stats',
                error.response?.data?.status || 'fail',
                error.response?.status
            );
        }
    }
};
