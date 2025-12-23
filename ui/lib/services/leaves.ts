import api, { ApiResponse } from '../api';

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

export interface LeavesResponse {
    leaves: Leave[];
}

export const leavesService = {
    // Get all leaves (admin)
    getAllLeaves: async (): Promise<ApiResponse<LeavesResponse>> => {
        const response = await api.get('/leaves');
        return response.data;
    },

    // Get leaves for a specific user
    getUserLeaves: async (userId: string): Promise<ApiResponse<LeavesResponse>> => {
        const response = await api.get(`/leaves/user/${userId}`);
        return response.data;
    },

    // Create a new leave request
    createLeave: async (leaveData: {
        type: string;
        startDate: string;
        endDate: string;
        reason?: string;
    }): Promise<ApiResponse<Leave>> => {
        const response = await api.post('/leaves', leaveData);
        return response.data;
    },

    // Update leave status (admin)
    updateLeaveStatus: async (
        leaveId: string,
        status: 'APPROVED' | 'REJECTED'
    ): Promise<ApiResponse<Leave>> => {
        const response = await api.patch(`/leaves/${leaveId}`, { status });
        return response.data;
    },

    // Delete a leave request
    deleteLeave: async (leaveId: string): Promise<ApiResponse<void>> => {
        const response = await api.delete(`/leaves/${leaveId}`);
        return response.data;
    },
};
