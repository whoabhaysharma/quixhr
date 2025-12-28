import { useQuery } from '@tanstack/react-query'
import { dashboardService, AdminStats, EmployeeStats } from '../services/dashboard'
import { toast } from 'sonner'

export function useAdminStats(enabled: boolean = true) {
    return useQuery({
        queryKey: ['dashboard', 'admin'],
        queryFn: async () => {
            try {
                const response = await dashboardService.getAdminStats()
                return response.data
            } catch (error: any) {
                // process error silently or toast
                throw error
            }
        },
        enabled
    })
}

export function useEmployeeStats(enabled: boolean = true) {
    return useQuery({
        queryKey: ['dashboard', 'employee'],
        queryFn: async () => {
            try {
                const response = await dashboardService.getEmployeeStats()
                return response.data
            } catch (error: any) {
                // process error silently or toast
                throw error
            }
        },
        enabled
    })
}
