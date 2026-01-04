import api, { ApiResponse } from '../api';

export interface User {
    id: string;
    email: string;
    role: string; // 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE' etc.
    isEmailVerified: boolean;
    employee?: {
        id: string;
        firstName: string;
        lastName: string;
        companyId: string;
    };
}

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
}

export interface RegisterResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
}

export const authService = {
    // Login with email and password
    login: async (email: string, password: string): Promise<ApiResponse<LoginResponse>> => {
        const response = await api.post('/auth/login', { email, password });
        return response.data;
    },

    // Register new company/user
    register: async (data: {
        firstName: string;
        lastName: string;
        email: string;
        password: string;
        confirmPassword: string;
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
        const response = await api.get(`/invitations/verify/${token}`);
        return response.data;
    },

    // Accept invite and register new user
    acceptInvite: async (data: {
        token: string;
        name: string;
        password: string;
    }): Promise<ApiResponse<LoginResponse>> => {
        // Invitations module handles acceptance
        const response = await api.post('/invitations/accept', data);
        return response.data;
    },

    // Get current user
    getCurrentUser: async (): Promise<ApiResponse<User>> => {
        const response = await api.get('/me');
        // Transform backend response { user, employee, company } to frontend User interface { ...user, employee: { ...employee } }
        const data = response.data as any;

        if (data.user && data.employee) {
            const user: User = {
                ...data.user,
                employee: {
                    ...data.employee
                }
            };
            // Preserve wrapper if it exists, otherwise return as data
            if (response.data.status) {
                return { ...response.data, data: user };
            }
            return { status: 'success', data: user, message: 'User profile retrieved' }; // Mock ApiResponse wrapper if needed
        }

        return response.data;
    },
    // Forgot password
    forgotPassword: async (email: string): Promise<ApiResponse<string>> => {
        const response = await api.post('/auth/forgot-password', { email });
        return response.data;
    },

    // Reset password
    resetPassword: async (token: string, password: string, confirmPassword: string): Promise<ApiResponse<string>> => {
        const response = await api.post('/auth/reset-password', { token, password, confirmPassword });
        return response.data;
    },

    // Verify email
    verifyEmail: async (token: string): Promise<ApiResponse<string>> => {
        const response = await api.post('/auth/verify-email', { token });
        return response.data;
    },
};
