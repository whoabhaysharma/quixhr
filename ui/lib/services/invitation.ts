import api from '../api';
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
    inviteUser: async (organizationId: string, data: CreateInvitationDto) => {
        const response = await api.post(`/org/${organizationId}/invitations`, data);
        return response.data;
    },

    /**
     * Get all invitations
     */
    getAll: async () => {
        const response = await api.get('/invitations');
        return response.data;
    },

    /**
     * Resend an invitation
     */
    resend: async (id: string) => {
        const response = await api.post(`/invitations/${id}/resend`);
        return response.data;
    },

    /**
     * Validate an invitation token
     */
    validateToken: async (token: string) => {
        const response = await api.get(`/invitations/verify/${token}`);
        return response.data;
    },

    /**
     * Accept an invitation
     */
    accept: async (data: { token: string; firstName: string; lastName: string; password: string }) => {
        const response = await api.post('/invitations/accept', data);
        return response.data;
    },

    /**
     * Delete an invitation
     */
    delete: async (id: string) => {
        const response = await api.delete(`/invitations/${id}`);
        return response.data;
    }
};
