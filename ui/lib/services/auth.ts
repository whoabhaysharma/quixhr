import api from '../api';
import { ApiResponse, ApiError } from '@/types/api';

export interface UserData {
    user: {
        id: string;
        email: string;
        role: string;
        isEmailVerified: boolean;
    };
    employee?: {
        id: string;
        organizationId: string;
        userId: string;
        firstName: string;
        lastName: string;
        status: string;
        joiningDate: string;
        calendarId?: string;
        leaveGradeId?: string;
        code?: string;
        managerId?: string;
    };
    organization?: {
        id: string;
        name: string;
        timezone: string;
        currency: string;
        dateFormat: string;
        logoUrl?: string;
        createdAt: string;
    };
}

// Legacy User interface for backward compatibility
export interface User {
    id: string;
    email: string;
    role: string;
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
        try {
            const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', { email, password });
            return response.data;
        } catch (error: any) {
            const message = error.response?.data?.message || 'Invalid email or password';
            const status = error.response?.data?.status || 'fail';
            const statusCode = error.response?.status;
            throw new ApiError(message, status, statusCode);
        }
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
        try {
            const response = await api.post<ApiResponse<RegisterResponse>>('/auth/register', data);
            return response.data;
        } catch (error: any) {
            const message = error.response?.data?.message || 'Registration failed';
            const status = error.response?.data?.status || 'fail';
            const statusCode = error.response?.status;
            throw new ApiError(message, status, statusCode);
        }
    },

    // Validate invite token (Get details)
    validateInvite: async (token: string): Promise<ApiResponse<{
        email: string;
        role: string;
        organization: { name: string };
    }>> => {
        try {
            const response = await api.get<ApiResponse<{
                email: string;
                role: string;
                organization: { name: string };
            }>>(`/invitations/verify/${token}`);
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Invalid or expired invite token',
                error.response?.data?.status || 'fail',
                error.response?.status
            );
        }
    },

    // Accept invite and register new user
    acceptInvite: async (data: {
        token: string;
        name: string;
        password: string;
    }): Promise<ApiResponse<LoginResponse>> => {
        try {
            // Invitations module handles acceptance
            const response = await api.post<ApiResponse<LoginResponse>>('/invitations/accept', data);
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to join organization',
                error.response?.data?.status || 'fail',
                error.response?.status
            );
        }
    },

    // Get current user - returns raw /me response
    getCurrentUser: async (): Promise<ApiResponse<UserData>> => {
        try {
            const response = await api.get<ApiResponse<UserData>>('/me');
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to fetch user profile',
                error.response?.data?.status || 'fail',
                error.response?.status
            );
        }
    },
    // Forgot password
    forgotPassword: async (email: string): Promise<ApiResponse<string>> => {
        try {
            const response = await api.post<ApiResponse<string>>('/auth/forgot-password', { email });
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to send reset link',
                error.response?.data?.status || 'fail',
                error.response?.status
            );
        }
    },

    // Reset password
    resetPassword: async (token: string, password: string, confirmPassword: string): Promise<ApiResponse<string>> => {
        try {
            const response = await api.post<ApiResponse<string>>('/auth/reset-password', { token, password, confirmPassword });
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to reset password',
                error.response?.data?.status || 'fail',
                error.response?.status
            );
        }
    },

    // Verify email
    verifyEmail: async (token: string): Promise<ApiResponse<string>> => {
        try {
            const response = await api.post<ApiResponse<string>>('/auth/verify-email', { token });
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Email verification failed',
                error.response?.data?.status || 'fail',
                error.response?.status
            );
        }
    },
};
