import api, { ApiResponse, PaginatedResponse } from '../api';

export interface Member {
    id: string;
    userId: string;
    companyId: string;
    name: string;
    email: string;
    role: 'SUPER_ADMIN' | 'HR_ADMIN' | 'MANAGER' | 'EMPLOYEE';
    status: string;
    createdAt: string;
}

export const membersService = {
    // Get all members in company
    getAllMembers: async (page = 1, limit = 10, search?: string): Promise<PaginatedResponse<Member[]>> => {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });
        if (search) params.append('search', search);

        const response = await api.get(`/members?${params.toString()}`);
        return response.data;
    },

    // Delete a member
    deleteMember: async (memberId: string): Promise<ApiResponse<void>> => {
        const response = await api.delete(`/members/${memberId}`);
        return response.data;
    },

    // Update member role
    updateMemberRole: async (
        memberId: string,
        role: string
    ): Promise<ApiResponse<Member>> => {
        const response = await api.patch(`/members/${memberId}`, { role });
        return response.data;
    },
};
