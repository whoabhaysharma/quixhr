import api, { ApiResponse } from '../api';

export interface Member {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'HR' | 'EMPLOYEE';
    organizationId: string;
    createdAt: string;
}

export interface MembersResponse {
    members: Member[];
}

export interface Invite {
    id: string;
    email: string;
    role: 'ADMIN' | 'HR' | 'EMPLOYEE';
    organizationId: string;
    token: string;
    expiresAt: string;
    createdAt: string;
}

export const membersService = {
    // Get all members in organization
    getAllMembers: async (): Promise<ApiResponse<MembersResponse>> => {
        const response = await api.get('/members');
        return response.data;
    },

    // Send invite to new member
    sendInvite: async (data: {
        email: string;
        role: 'ADMIN' | 'HR' | 'EMPLOYEE';
    }): Promise<ApiResponse<{ message: string; invite: Invite }>> => {
        const response = await api.post('/invites', data);
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
        role: 'ADMIN' | 'HR' | 'EMPLOYEE'
    ): Promise<ApiResponse<Member>> => {
        const response = await api.patch(`/members/${memberId}`, { role });
        return response.data;
    },
};
