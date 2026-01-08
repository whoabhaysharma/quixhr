import api from '../api';
import { ApiResponse, ApiError } from '@/types/api';
import { Role } from '../constants/roles';

export interface PaginatedResponse<T> {
    success: boolean;
    data: {
        data: T;
        pagination?: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    };
}

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
        try {
            const response = await api.get<PaginatedResponse<Member[]>>(`${url}?${params.toString()}`);
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to fetch members',
                error.response?.data?.status,
                error.response?.status
            );
        }
    },

    // Delete a member
    deleteMember: async (memberId: string): Promise<ApiResponse<void>> => {
        try {
            const response = await api.delete<ApiResponse<void>>(`/members/${memberId}`);
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to delete member',
                error.response?.data?.status,
                error.response?.status
            );
        }
    },

    // Update member role
    updateMemberRole: async (
        memberId: string,
        role: string
    ): Promise<ApiResponse<Member>> => {
        try {
            const response = await api.patch<ApiResponse<Member>>(`/members/${memberId}/role`, { role });
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to update member role',
                error.response?.data?.status,
                error.response?.status
            );
        }
    },

    // Assign calendar to member
    assignCalendar: async (
        memberId: string,
        calendarId: string
    ): Promise<ApiResponse<Member>> => {
        try {
            const response = await api.patch<ApiResponse<Member>>(`/members/${memberId}/calendar`, { calendarId });
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to assign calendar',
                error.response?.data?.status,
                error.response?.status
            );
        }
    },

    // Assign leave grade to member
    assignLeaveGrade: async (
        memberId: string,
        leaveGradeId: string
    ): Promise<ApiResponse<Member>> => {
        try {
            const response = await api.patch<ApiResponse<Member>>(`/members/${memberId}/leave-grade`, { leaveGradeId });
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to assign leave grade',
                error.response?.data?.status,
                error.response?.status
            );
        }
    },
};
