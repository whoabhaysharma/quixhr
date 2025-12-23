import api, { ApiResponse } from '../api';

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'HR' | 'EMPLOYEE';
    organizationId: string;
}

export interface LoginResponse {
    token: string;
    user: User;
}

export interface RegisterResponse {
    message: string;
}

export const authService = {
    // Login with email and password
    login: async (email: string, password: string): Promise<ApiResponse<LoginResponse>> => {
        const response = await api.post('/auth/login', { email, password });
        return response.data;
    },

    // Send verification code for registration
    sendVerificationCode: async (email: string): Promise<ApiResponse<{ message: string }>> => {
        const response = await api.post('/auth/send-verification-code', { email });
        return response.data;
    },

    // Complete registration
    register: async (data: {
        name: string;
        email: string;
        password: string;
        verificationCode: string;
        organizationName: string;
    }): Promise<ApiResponse<RegisterResponse>> => {
        const response = await api.post('/auth/register', data);
        return response.data;
    },

    // Validate invite token
    validateInvite: async (token: string): Promise<ApiResponse<{
        email: string;
        role: string;
        organizationId: string;
    }>> => {
        const response = await api.post('/invites/validate', { token });
        return response.data;
    },

    // Accept invite and register
    acceptInvite: async (data: {
        token: string;
        name: string;
        password: string;
    }): Promise<ApiResponse<LoginResponse>> => {
        const response = await api.post('/invites/accept', data);
        return response.data;
    },

    // Get current user
    getCurrentUser: async (): Promise<ApiResponse<User>> => {
        const response = await api.get('/auth/me');
        return response.data;
    },
};
