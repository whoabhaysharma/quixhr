import api from '../api';
import { ApiResponse, ApiError } from '@/types/api';
import { Role } from '../constants/roles';

export interface CreateInvitationDto {
    email: string;
    role: Role;
}

export interface Invitation {
    id: string;
    email: string;
    role: string;
    status: string;
    createdAt: string;
    expiresAt: string;
}

export const invitationService = {
    /**
     * Invite a new user
     */
    inviteUser: async (organizationId: string, data: CreateInvitationDto): Promise<ApiResponse<Invitation>> => {
        try {
            const response = await api.post<ApiResponse<Invitation>>(`/org/${organizationId}/invitations`, data);
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to send invitation',
                error.response?.data?.status,
                error.response?.status
            );
        }
    },

    /**
     * Get all invitations
     */
    getAll: async (): Promise<ApiResponse<any>> => {
        try {
            const response = await api.get<ApiResponse<any>>('/invitations');
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to fetch invitations',
                error.response?.data?.status,
                error.response?.status
            );
        }
    },

    /**
     * Resend an invitation
     */
    resend: async (id: string): Promise<ApiResponse<any>> => {
        try {
            const response = await api.post<ApiResponse<any>>(`/invitations/${id}/resend`);
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to resend invitation',
                error.response?.data?.status,
                error.response?.status
            );
        }
    },

    /**
     * Validate an invitation token
     */
    validateToken: async (token: string): Promise<ApiResponse<any>> => {
        try {
            const response = await api.get<ApiResponse<any>>(`/invitations/verify/${token}`);
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Invalid or expired invitation token',
                error.response?.data?.status,
                error.response?.status
            );
        }
    },

    /**
     * Accept an invitation
     */
    accept: async (data: { token: string; firstName: string; lastName: string; password: string }): Promise<ApiResponse<any>> => {
        try {
            const response = await api.post<ApiResponse<any>>('/invitations/accept', data);
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to accept invitation',
                error.response?.data?.status,
                error.response?.status
            );
        }
    },

    /**
     * Delete an invitation
     */
    delete: async (id: string): Promise<ApiResponse<void>> => {
        try {
            const response = await api.delete<ApiResponse<void>>(`/invitations/${id}`);
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to delete invitation',
                error.response?.data?.status,
                error.response?.status
            );
        }
    }
};
