import { useQuery } from '@tanstack/react-query'
import { dashboardService, AdminStats, EmployeeStats } from '../services/dashboard'
import { toast } from 'sonner'

export function useAdminStats() {
    return useQuery({
        queryKey: ['dashboard', 'admin'],
        queryFn: async () => {
            try {
                const response = await dashboardService.getAdminStats()
                return response.data
            } catch (error: any) {
                toast.error(error.response?.data?.message || 'Failed to load admin dashboard stats')
                throw error
            }
        },
    })
}

export function useEmployeeStats() {
    return useQuery({
        queryKey: ['dashboard', 'employee'],
        queryFn: async () => {
            try {
                const response = await dashboardService.getEmployeeStats()
                return response.data
            } catch (error: any) {
                toast.error(error.response?.data?.message || 'Failed to load employee dashboard stats')
                throw error
            }
        },
    })
}
