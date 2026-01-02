import { useQuery } from '@tanstack/react-query'
import { dashboardService, AdminStats, EmployeeStats } from '../services/dashboard'
import { toast } from 'sonner'
import { useAuth } from './useAuth'

export function useAdminStats() {
    return useQuery({
        queryKey: ['dashboard', 'stats'],
        queryFn: async () => {
            try {
                const response = await dashboardService.getStats()
                return response.data as AdminStats
            } catch (error: any) {
                console.error("Failed to fetch dashboard stats:", error);
                throw error
            }
        }
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
