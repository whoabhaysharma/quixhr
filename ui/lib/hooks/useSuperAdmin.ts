import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { superAdminService } from '../services/super-admin';
import { toast } from 'sonner';

// Companies Hooks
export const useCompanies = (params?: { page?: number; limit?: number; search?: string }) => {
    return useQuery({
        queryKey: ['companies', params],
        queryFn: () => superAdminService.getCompanies(params),
        placeholderData: (previousData) => previousData,
    });
};

export const useCompany = (id: string) => {
    return useQuery({
        queryKey: ['company', id],
        queryFn: () => superAdminService.getCompany(id),
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
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create company');
        }
    });
};

export const useAdmins = (params?: { page?: number; limit?: number; search?: string }) => {
    return useQuery({
        queryKey: ['admins', params],
        queryFn: () => superAdminService.getAdmins(params),
        placeholderData: (previousData) => previousData
    });
};
