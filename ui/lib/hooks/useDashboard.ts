import { useQuery } from '@tanstack/react-query'
import { dashboardService, AdminStats, EmployeeStats } from '../services/dashboard'

export function useAdminStats() {
    return useQuery({
        queryKey: ['dashboard', 'admin'],
        queryFn: async () => {
            const response = await dashboardService.getAdminStats()
            return response.data
        },
    })
}

export function useEmployeeStats() {
    return useQuery({
        queryKey: ['dashboard', 'employee'],
        queryFn: async () => {
            const response = await dashboardService.getEmployeeStats()
            return response.data
        },
    })
}
