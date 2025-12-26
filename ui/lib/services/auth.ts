import api, { ApiResponse } from '../api';

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'HR' | 'EMPLOYEE';
    organizationId: string;
    holidayCalendarId?: string;
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
        const response = await api.post('/auth/send-verification', { email });
        return response.data;
    },

    // Complete registration
    register: async (data: {
        name: string;
        email: string;
        password: string;
        otp: string;
        organizationName: string;
    }): Promise<ApiResponse<RegisterResponse>> => {
        const response = await api.post('/auth/register', data);
        return response.data;
    },

    // Validate invite token (Get details)
    validateInvite: async (token: string): Promise<ApiResponse<{
        email: string;
        role: string;
        organization: { name: string };
    }>> => {
        const response = await api.get(`/invites/${token}`);
        return response.data;
    },

    // Accept invite and register new user
    acceptInvite: async (data: {
        token: string;
        name: string;
        password: string;
    }): Promise<ApiResponse<LoginResponse>> => {
        const response = await api.post('/auth/register-invite', data);
        return response.data;
    },

    // Get current user
    getCurrentUser: async (): Promise<ApiResponse<User>> => {
        const response = await api.get('/auth/me');
        return response.data;
    },
    // Forgot password
    forgotPassword: async (email: string): Promise<ApiResponse<{ message: string }>> => {
        const response = await api.post('/auth/forgot-password', { email });
        return response.data;
    },

    // Reset password
    resetPassword: async (token: string, password: string): Promise<ApiResponse<{ message: string }>> => {
        const response = await api.post('/auth/reset-password', { token, password });
        return response.data;
    },
};
