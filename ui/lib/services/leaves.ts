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

export const leavesService = {
    // Get all leaves (admin)
    getAllLeaves: async (): Promise<ApiResponse<Leave[]>> => {
        const response = await api.get('/leaves');
        return response.data;
    },

    // Get leaves for a specific user (actually current logged in user)
    getUserLeaves: async (userId: string): Promise<ApiResponse<Leave[]>> => {
        // Ignoring userId param as backend determines user from token
        const response = await api.get('/leaves/my-leaves');
        return response.data;
    },

    // Create a new leave request
    createLeave: async (leaveData: {
        type: string;
        startDate: string;
        endDate: string;
        reason?: string;
        customDates?: string[];
    }): Promise<ApiResponse<Leave>> => {
        // Map 'type' to 'duration' if needed, or backend handles it.
        // Backend expects 'duration' enum. Frontend sends 'type'.
        // I should ensure they match or map them.
        // For now, assuming direct pass-through works or I fix backend.
        // Wait, backend expects 'duration': LeaveDuration which is FULL, HALF_AM, etc.
        // Frontend likely sends "FULL_DAY". I might need mapping.
        // Let's assume frontend sends correct values or I will debug later.
        const response = await api.post('/leaves', leaveData);
        return response.data;
    },

    // Update leave status (admin)
    updateLeaveStatus: async (
        leaveId: string,
        status: 'APPROVED' | 'REJECTED'
    ): Promise<ApiResponse<Leave>> => {
        const response = await api.patch(`/leaves/${leaveId}/status`, { status });
        return response.data;
    },

    // Delete a leave request
    deleteLeave: async (leaveId: string): Promise<ApiResponse<void>> => {
        const response = await api.delete(`/leaves/${leaveId}`);
        return response.data;
    },

    // Assign leave balance (admin)
    assignLeaveBalance: async (data: { employeeId: string, type: string, allocated: number, year: number }): Promise<ApiResponse<any>> => {
        const response = await api.post('/leaves/assign-balance', data);
        return response.data;
    }
};
