import api from '../api';

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
    getCompanies: async (params?: { page?: number; limit?: number; search?: string }) => {
        const response = await api.get('/companies', { params });
        return response.data.data;
    },

    getCompany: async (id: string) => {
        const response = await api.get(`/companies/${id}`);
        return response.data;
    },

    createCompany: async (data: any) => {
        const response = await api.post('/companies', data);
        return response.data;
    },

    // Admins
    getAdmins: async (params?: { page?: number; limit?: number; search?: string }) => {
        const response = await api.get('/users', {
            params: { ...params, role: 'SUPER_ADMIN' }
        });
        return response.data.data;
    }
};
