import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { leavesService, Leave } from '../services/leaves'
import { toast } from 'sonner'
import { ApiError } from '@/types/api'

// For Employee: Get my leaves
export function useLeaves(userId?: string) {
    return useQuery({
        queryKey: ['my-leaves'],
        queryFn: async () => {
            try {
                const response = await leavesService.getMyLeaves()
                // Backend now returns PaginatedResponse: { data: Leave[], pagination: ... }
                // So response.data.data is the array of leaves.
                // We cast to any to be safe if types aren't fully updated, or verify types.
                // response.data is ApiResponse<PaginatedResponse<Leave>>
                // response.data.data is PaginatedResponse<Leave>
                // response.data.data.data is Leave[]
                return (response.data as any).data || []
            } catch (error: any) {
                const msg = error instanceof ApiError ? error.message : (error.message || 'Failed to load leave records');
                toast.error(msg)
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
                const response = await leavesService.getOrgLeaveRequests(organizationId, filters)
                // Backend now returns PaginatedResponse: { data: Leave[], pagination: ... }
                const result = response.data as any;
                // result is the data payload from ApiResponse. 
                // It should have .data (array) and .pagination.
                const requests = result.data || [];

                return requests.map((req: any) => ({
                    ...req,
                    totalDays: req.daysTaken ?? req.totalDays, // fallback/compatibility
                    user: req.user || (req.employee ? {
                        id: req.employee.id,
                        name: `${req.employee.firstName} ${req.employee.lastName}`.trim(),
                        email: req.employee.code || 'N/A'
                    } : undefined)
                }));
            } catch (error: any) {
                const msg = error instanceof ApiError ? error.message : (error.message || 'Failed to load organization leave requests');
                toast.error(msg)
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
            customDates?: string[]
        }) => leavesService.createLeave(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-leaves'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard'] })
            toast.success('Leave request submitted successfully');
        },
        onError: (error: ApiError | Error) => {
            const msg = error.message || 'Failed to submit leave request';
            toast.error(msg);
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
        onError: (error: ApiError | Error) => {
            const msg = error.message || 'Failed to update leave status';
            toast.error(msg);
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
        onError: (error: ApiError | Error) => {
            const msg = error.message || 'Failed to delete leave request';
            toast.error(msg);
        },
    })
}

export function useAssignLeaveBalance() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: { employeeId: string, type: string, allocated: number, year: number }) => leavesService.assignLeaveBalance(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['org-leaves'] })
            toast.success('Leave balance assigned successfully');
        },
        onError: (error: ApiError | Error) => {
            const msg = error.message || 'Failed to assign leave balance';
            toast.error(msg);
        },
    })
}