import api from '../api';
import { ApiResponse, ApiError } from '@/types/api';

export interface Company {
    id: string;
    name: string;
    createdAt: string;
    _count?: {
        employees: number;
    };
}

export const superAdminService = {
    // Companies
    getCompanies: async (params?: { page?: number; limit?: number; search?: string }): Promise<any> => {
        try {
            const response = await api.get('/companies', { params });
            // API likely returns { status: 'success', data: { data: [], pagination: ... } }
            // So we return response.data.data
            return response.data.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to fetch companies',
                error.response?.data?.status,
                error.response?.status
            );
        }
    },

    getCompany: async (id: string): Promise<ApiResponse<Company>> => {
        try {
            const response = await api.get<ApiResponse<Company>>(`/companies/${id}`);
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to fetch company details',
                error.response?.data?.status,
                error.response?.status
            );
        }
    },

    createCompany: async (data: any): Promise<ApiResponse<any>> => {
        try {
            const response = await api.post<ApiResponse<any>>('/companies', data);
            return response.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to create company',
                error.response?.data?.status,
                error.response?.status
            );
        }
    },

    // Admins
    getAdmins: async (params?: { page?: number; limit?: number; search?: string }): Promise<any> => {
        try {
            const response = await api.get('/users', {
                params: { ...params, role: 'SUPER_ADMIN' }
            });
            return response.data.data;
        } catch (error: any) {
            throw new ApiError(
                error.response?.data?.message || 'Failed to fetch admins',
                error.response?.data?.status,
                error.response?.status
            );
        }
    }
};
