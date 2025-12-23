import api, { ApiResponse } from '../api';

export interface AdminStats {
    totalEmployees: number;
    onLeaveToday: number;
    pendingLeaves: number;
}

export interface EmployeeStats {
    allowance: number;
    used: number;
    balance: number;
    pendingRequests: number;
}

export const dashboardService = {
    // Get admin dashboard statistics
    getAdminStats: async (): Promise<ApiResponse<AdminStats>> => {
        const response = await api.get('/dashboard/admin-stats');
        return response.data;
    },

    // Get employee dashboard statistics
    getEmployeeStats: async (): Promise<ApiResponse<EmployeeStats>> => {
        const response = await api.get('/dashboard/employee-stats');
        return response.data;
    },
};
