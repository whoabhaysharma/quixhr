import { useQuery } from '@tanstack/react-query'
import { dashboardService, AdminStats, EmployeeStats } from '../services/dashboard'
import { ApiError } from '@/types/api'

export function useAdminStats(organizationId?: string) {
    return useQuery({
        queryKey: ['dashboard', 'stats', organizationId],
        queryFn: async () => {
            if (!organizationId) throw new Error("Organization ID is required");
            try {
                const response = await dashboardService.getAdminStats(organizationId)
                return response.data as AdminStats
            } catch (error: any) {
                console.error("Failed to fetch dashboard stats:", error);
                throw error
            }
        },
        enabled: !!organizationId
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
                throw error
            }
        },
        enabled
    })
}
