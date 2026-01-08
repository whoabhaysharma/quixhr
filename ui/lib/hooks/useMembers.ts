import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { membersService } from '../services/members'
import { invitationService } from '../services/invitation'
import { Role } from '@/lib/constants/roles'
import { toast } from 'sonner'
import { ApiError } from '@/types/api' // Import consistent error type

import { useAuth } from '@/context/auth-context'

export function useMembers(options?: { enabled?: boolean }) {
    const { user } = useAuth()
    const organizationId = user?.organization?.id || user?.employee?.organizationId

    return useQuery({
        queryKey: ['members', organizationId],
        queryFn: async () => {
            try {
                const response = await membersService.getAllMembers(organizationId)
                return response
            } catch (error: any) {
                // Services now throw ApiError or Error with a message
                const msg = error instanceof ApiError ? error.message : (error.message || 'Failed to load members list');
                toast.error(msg)
                throw error
            }
        },
        enabled: options?.enabled && !!organizationId,
    })
}

export function useSendInvite() {
    const queryClient = useQueryClient()
    const { user } = useAuth()
    const organizationId = user?.organization?.id || user?.employee?.organizationId

    return useMutation({
        mutationFn: (data: { email: string; role: Role }) => {
            if (!organizationId) throw new Error("Organization ID is required")
            return invitationService.inviteUser(organizationId, data)
        },
        onSuccess: () => {
            // Optionally refetch members list
            queryClient.invalidateQueries({ queryKey: ['members'] })
            queryClient.invalidateQueries({ queryKey: ['invitations'] })
            toast.success('Invitation sent successfully');
        },
        onError: (error: ApiError | Error) => {
            const errorMessage = error.message || 'Failed to send invitation';
            toast.error(errorMessage);
        },
    })
}

export function useDeleteMember() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (memberId: string) => membersService.deleteMember(memberId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members'] })
            toast.success('Member removed successfully');
        },
        onError: (error: ApiError | Error) => {
            const errorMessage = error.message || 'Failed to remove member';
            toast.error(errorMessage);
        },
    })
}

export function useUpdateMemberRole() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({
            memberId,
            role,
        }: {
            memberId: string
            role: string
        }) => membersService.updateMemberRole(memberId, role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members'] })
            toast.success('Member role updated successfully');
        },
        onError: (error: ApiError | Error) => {
            const errorMessage = error.message || 'Failed to update member role';
            toast.error(errorMessage);
        },
    })
}

export function useInvitations() {
    return useQuery({
        queryKey: ['invitations'],
        queryFn: async () => {
            try {
                const response = await invitationService.getAll()
                // Backend returns: { status: 'success', data: { data: [], pagination: {} } }
                // response.data is the 'data' field of the body
                const result = response.data;
                // Since the service already returns response.data, let's check structure
                // With new typing: invitationService.getAll() returns ApiResponse<any>
                // So response.data is { data: [], pagination: ... } if standardized,
                // OR likely response.data IS the array if the backend structure is flat
                // Let's assume standard { data: [], pagination: {} } -> returns data property.
                return Array.isArray(result) ? result : (result?.data || [])
            } catch (error: any) {
                const msg = error instanceof ApiError ? error.message : (error.message || 'Failed to load invitations');
                toast.error(msg)
                throw error
            }
        }
    })
}

export function useResendInvitation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => invitationService.resend(id),
        onSuccess: () => {
            toast.success('Invitation resent successfully')
        },
        onError: (error: ApiError | Error) => {
            const errorMessage = error.message || 'Failed to resend invitation'
            toast.error(errorMessage)
        }
    })
}

export function useDeleteInvitation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => invitationService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invitations'] })
            toast.success('Invitation removed successfully')
        },
        onError: (error: ApiError | Error) => {
            const errorMessage = error.message || 'Failed to remove invitation'
            toast.error(errorMessage)
        }
    })
}

export function useAssignCalendar() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ memberId, calendarId }: { memberId: string, calendarId: string }) =>
            membersService.assignCalendar(memberId, calendarId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members'] })
            toast.success('Calendar assigned successfully')
        },
        onError: (error: ApiError | Error) => {
            const errorMessage = error.message || 'Failed to assign calendar'
            toast.error(errorMessage)
        }
    })
}
