import api, { ApiResponse, PaginatedResponse } from '../api';
import { Role } from '../constants/roles';

export interface Member {
    id: string;
    userId: string;
    companyId: string;
    name: string;
    email: string;
    role: Role;
    status: string;
    createdAt: string;
}

export const membersService = {
    // Get all members in company
    getAllMembers: async (organizationId?: string, page = 1, limit = 10, search?: string): Promise<PaginatedResponse<Member[]>> => {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });
        if (search) params.append('search', search);

        const url = organizationId ? `/org/${organizationId}/members` : '/members';
        const response = await api.get(`${url}?${params.toString()}`);
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
        const response = await api.patch(`/members/${memberId}/role`, { role });
        return response.data;
    },

    // Assign calendar to member
    assignCalendar: async (
        memberId: string,
        calendarId: string
    ): Promise<ApiResponse<Member>> => {
        const response = await api.patch(`/members/${memberId}/calendar`, { calendarId });
        return response.data;
    },

    // Assign leave grade to member
    assignLeaveGrade: async (
        memberId: string,
        leaveGradeId: string
    ): Promise<ApiResponse<Member>> => {
        const response = await api.patch(`/members/${memberId}/leave-grade`, { leaveGradeId });
        return response.data;
    },
};
