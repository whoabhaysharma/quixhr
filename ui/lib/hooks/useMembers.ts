import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { membersService } from '../services/members'
import { invitationService } from '../services/invitation'
import { Role } from '@/lib/constants/roles'
import { toast } from 'sonner'

import { useAuth } from '@/context/auth-context'

export function useMembers(options?: { enabled?: boolean }) {
    const { user } = useAuth()
    const organizationId = user?.organizationId || user?.employee?.organizationId

    return useQuery({
        queryKey: ['members', organizationId],
        queryFn: async () => {
            try {
                const response = await membersService.getAllMembers(organizationId)
                return response
            } catch (error: any) {
                const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to load members list'
                toast.error(errorMessage)
                throw error
            }
        },
        enabled: options?.enabled && !!organizationId,
    })
}

export function useSendInvite() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: { email: string; role: Role }) =>
            invitationService.inviteUser(data),
        onSuccess: () => {
            // Optionally refetch members list
            queryClient.invalidateQueries({ queryKey: ['members'] })
            queryClient.invalidateQueries({ queryKey: ['invitations'] })
            toast.success('Invitation sent successfully');
        },
        onError: (error: any) => {
            const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to send invitation';
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
        onError: (error: any) => {
            const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to remove member';
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
        onError: (error: any) => {
            const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to update member role';
            toast.error(errorMessage);
        },
    })
}

export function useInvitations() {
    return useQuery({
        queryKey: ['invitations'],
        queryFn: async () => {
            const response = await invitationService.getAll()
            console.log("DEBUG: useInvitations response", response)
            // Backend returns: { success: true, data: { data: [], pagination: {} } }
            // response.data is the 'data' field of the body
            const result = response.data?.data;
            console.log("DEBUG: useInvitations extracted result", result)
            return Array.isArray(result) ? result : []
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
        onError: (error: any) => {
            const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to resend invitation'
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
        onError: (error: any) => {
            const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to remove invitation'
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
        onError: (error: any) => {
            const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to assign calendar'
            toast.error(errorMessage)
        }
    })
}
