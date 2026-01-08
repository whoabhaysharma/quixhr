import api from '../api';
import { ApiResponse, ApiError } from '@/types/api';

export interface Leave {
    id: string;
    userId: string;
    type: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    reason?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
    updatedAt: string;
    user?: {
        id: string;
        name: string;
        email: string;
    };
}

export interface LeaveListResponse {
    requests: Leave[];
    total: number;
}

export const leavesService = {
    // Get leaves for current user
    getMyLeaves: async (page = 1, limit = 10, status?: string): Promise<ApiResponse<LeaveListResponse>> => {
        try {
            const response = await api.get<ApiResponse<LeaveListResponse>>('/me/leaves/requests', {
                params: { page, limit, status }
            });
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to fetch leaves',
                error.response?.data?.status,
                error.response?.status
            );
        }
    },

    // Get leave balance for current user
    getMyLeaveBalance: async (year?: number): Promise<ApiResponse<any>> => {
        try {
            const response = await api.get<ApiResponse<any>>('/me/leaves/balance', {
                params: { year }
            });
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to fetch leave balance',
                error.response?.data?.status,
                error.response?.status
            );
        }
    },

    // Get leave policies for current user
    getMyLeavePolicies: async (): Promise<ApiResponse<any>> => {
        try {
            const response = await api.get<ApiResponse<any>>('/me/leaves/policies');
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to fetch leave policies',
                error.response?.data?.status,
                error.response?.status
            );
        }
    },

    // Create a new leave request (Employee)
    createLeave: async (leaveData: {
        type: string;
        startDate: string;
        endDate: string;
        reason?: string;
        dayDetails?: any;
    }): Promise<ApiResponse<Leave>> => {
        try {
            const response = await api.post<ApiResponse<Leave>>('/me/leaves/requests', leaveData);
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to create leave request',
                error.response?.data?.status,
                error.response?.status
            );
        }
    },

    // Get all leave requests for an organization (Admin/Manager)
    getOrgLeaveRequests: async (
        organizationId: string,
        params?: {
            page?: number;
            limit?: number;
            status?: string;
            type?: string;
            employeeId?: string;
            startDate?: string;
            endDate?: string;
            sortBy?: string;
            search?: string;
        }
    ): Promise<ApiResponse<LeaveListResponse>> => {
        try {
            const response = await api.get<ApiResponse<LeaveListResponse>>(`/org/${organizationId}/leaves`, {
                params: {
                    page: params?.page || 1,
                    limit: params?.limit || 100,
                    ...params
                }
            });
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to fetch organization leave requests',
                error.response?.data?.status,
                error.response?.status
            );
        }
    },

    // Update leave status (Admin/Manager) - Flat API
    updateLeaveStatus: async (
        requestId: string,
        status: 'APPROVED' | 'REJECTED',
        remarks?: string
    ): Promise<ApiResponse<Leave>> => {
        try {
            const response = await api.patch<ApiResponse<Leave>>(`/leaves/requests/${requestId}/status`, { status, remarks });
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to update leave status',
                error.response?.data?.status,
                error.response?.status
            );
        }
    },

    // Delete a leave request (if pending)
    deleteLeave: async (requestId: string): Promise<ApiResponse<void>> => {
        try {
            const response = await api.delete<ApiResponse<void>>(`/leaves/requests/${requestId}`);
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to delete leave request',
                error.response?.data?.status,
                error.response?.status
            );
        }
    },

    // Assign leave balance (admin) - Uses Allocation Endpoint technically
    assignLeaveBalance: async (data: { employeeId: string, type: string, allocated: number, year: number }): Promise<ApiResponse<any>> => {
        try {
            const response = await api.post<ApiResponse<any>>('/leaves/assign-balance', data);
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to assign leave balance',
                error.response?.data?.status,
                error.response?.status
            );
        }
    }
};
