import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { superAdminService } from '../services/super-admin';
import { toast } from 'sonner';
import { ApiError } from '@/types/api';

// Companies Hooks
export const useCompanies = (params?: { page?: number; limit?: number; search?: string }) => {
    return useQuery({
        queryKey: ['companies', params],
        queryFn: async () => {
            try {
                return await superAdminService.getCompanies(params);
            } catch (error: any) {
                const msg = error instanceof ApiError ? error.message : (error.message || 'Failed to load companies');
                toast.error(msg);
                throw error;
            }
        },
        placeholderData: (previousData) => previousData,
    });
};

export const useCompany = (id: string) => {
    return useQuery({
        queryKey: ['company', id],
        queryFn: async () => {
            try {
                return await superAdminService.getCompany(id);
            } catch (error: any) {
                const msg = error instanceof ApiError ? error.message : (error.message || 'Failed to load company details');
                toast.error(msg);
                throw error;
            }
        },
        enabled: !!id
    });
};

export const useCreateCompany = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: superAdminService.createCompany,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['companies'] });
            toast.success('Company created successfully');
        },
        onError: (error: ApiError | Error) => {
            const msg = error.message || 'Failed to create company';
            toast.error(msg);
        }
    });
};

export const useAdmins = (params?: { page?: number; limit?: number; search?: string }) => {
    return useQuery({
        queryKey: ['admins', params],
        queryFn: async () => {
            try {
                return await superAdminService.getAdmins(params);
            } catch (error: any) {
                const msg = error instanceof ApiError ? error.message : (error.message || 'Failed to load admins');
                toast.error(msg);
                throw error;
            }
        },
        placeholderData: (previousData) => previousData
    });
};
