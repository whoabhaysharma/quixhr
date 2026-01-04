import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { leavesService, Leave } from '../services/leaves'
import { toast } from 'sonner'

// For Employee: Get my leaves
export function useLeaves(userId?: string) {
    return useQuery({
        queryKey: ['my-leaves'],
        queryFn: async () => {
            try {
                // userId is not needed for getMyLeaves as it uses the token
                const response = await leavesService.getMyLeaves()
                // Return the requests array
                return response.data.requests
            } catch (error: any) {
                toast.error(error.response?.data?.message || 'Failed to load leave records')
                throw error
            }
        },
    })
}

// For Admin/Manager: Get organization leaves with filters
export function useOrgLeaves(
    organizationId: string,
    filters?: {
        page?: number;
        limit?: number;
        status?: string;
        type?: string;
        employeeId?: string;
        startDate?: string;
        endDate?: string;
        sortBy?: string;
        search?: string;
    }
) {
    return useQuery({
        queryKey: ['org-leaves', organizationId, filters],
        queryFn: async () => {
            try {
                // The backend returns a different structure for Org leaves: { data: [], pagination: {} }
                const response = await leavesService.getOrgLeaveRequests(organizationId, filters)
                const responseData = response.data as any; // Type assertion since service type is currently incorrectly typed for this endpoint

                // Handle both possible structures (requests array or data array)
                const rawRequests = responseData.requests || responseData.data || [];

                // Map to frontend Leave interface
                return rawRequests.map((req: any) => ({
                    ...req,
                    totalDays: req.daysTaken,
                    user: req.employee ? {
                        id: req.employee.id,
                        name: `${req.employee.firstName} ${req.employee.lastName}`.trim(),
                        email: req.employee.code || 'N/A' // Fallback since email isn't in default query
                    } : undefined
                }));
            } catch (error: any) {
                toast.error(error.response?.data?.message || 'Failed to load organization leave requests')
                throw error
            }
        },
        enabled: !!organizationId
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
            dayDetails?: any
            customDates?: string[] // Kept for types, but should map to dayDetails or backend handles it
        }) => leavesService.createLeave(data),
        onSuccess: () => {
            // Invalidate and refetch leaves queries
            queryClient.invalidateQueries({ queryKey: ['my-leaves'] })
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
            requestId,
            status,
            remarks
        }: {
            requestId: string
            status: 'APPROVED' | 'REJECTED'
            remarks?: string
        }) => leavesService.updateLeaveStatus(requestId, status, remarks),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['org-leaves'] })
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
        mutationFn: (requestId: string) => leavesService.deleteLeave(requestId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-leaves'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard'] })
            toast.success('Leave request deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete leave request');
        },
    })
}

export function useAssignLeaveBalance() {
    const queryClient = useQueryClient()

    return useMutation({
        // Note: assignLeaveBalance was removed from leavesService in previous step? 
        // Let me check leavesService.ts content again.
        // It seems I might have removed it from the service too.
        // Re-adding it here assuming I will fix service or it exists.
        // Actually, let's check service first to be safe.
        mutationFn: (data: { employeeId: string, type: string, allocated: number, year: number }) => leavesService.assignLeaveBalance(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['org-leaves'] })
            toast.success('Leave balance assigned successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to assign leave balance');
        },
    })
}