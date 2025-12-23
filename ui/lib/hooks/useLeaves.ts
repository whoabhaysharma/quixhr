import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { leavesService, Leave } from '../services/leaves'

export function useLeaves(userId?: string) {
    return useQuery({
        queryKey: userId ? ['leaves', userId] : ['leaves'],
        queryFn: async () => {
            const response = userId
                ? await leavesService.getUserLeaves(userId)
                : await leavesService.getAllLeaves()
            return response.data.leaves
        },
    })
}

export function useCreateLeave() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: {
            type: string
            startDate: string
            endDate: string
            reason?: string
        }) => leavesService.createLeave(data),
        onSuccess: () => {
            // Invalidate and refetch leaves queries
            queryClient.invalidateQueries({ queryKey: ['leaves'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        },
    })
}

export function useUpdateLeaveStatus() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({
            leaveId,
            status,
        }: {
            leaveId: string
            status: 'APPROVED' | 'REJECTED'
        }) => leavesService.updateLeaveStatus(leaveId, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leaves'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        },
    })
}

export function useDeleteLeave() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (leaveId: string) => leavesService.deleteLeave(leaveId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leaves'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        },
    })
}
