import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { leavesService, Leave } from '../services/leaves'
import { toast } from 'sonner'

export function useLeaves(userId?: string) {
    return useQuery({
        queryKey: userId ? ['leaves', userId] : ['leaves'],
        queryFn: async () => {
            try {
                const response = userId
                    ? await leavesService.getUserLeaves(userId)
                    : await leavesService.getAllLeaves()
                return response.data.leaves
            } catch (error: any) {
                toast.error(error.response?.data?.message || 'Failed to load leave records')
                throw error
            }
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
            toast.success('Leave request submitted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to submit leave request');
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
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['leaves'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard'] })
            toast.success(`Leave request ${variables.status.toLowerCase()} successfully`);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update leave status');
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
            toast.success('Leave request deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete leave request');
        },
    })
}
