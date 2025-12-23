import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { membersService } from '../services/members'
import { toast } from 'sonner'

export function useMembers() {
    return useQuery({
        queryKey: ['members'],
        queryFn: async () => {
            try {
                const response = await membersService.getAllMembers()
                return response.data.members
            } catch (error: any) {
                toast.error(error.response?.data?.message || 'Failed to load members list')
                throw error
            }
        },
    })
}

export function useSendInvite() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: { email: string; role: 'ADMIN' | 'HR' | 'EMPLOYEE' }) =>
            membersService.sendInvite(data),
        onSuccess: () => {
            // Optionally refetch members list
            queryClient.invalidateQueries({ queryKey: ['members'] })
            toast.success('Invitation sent successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to send invitation');
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
            toast.error(error.response?.data?.message || 'Failed to remove member');
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
            role: 'ADMIN' | 'HR' | 'EMPLOYEE'
        }) => membersService.updateMemberRole(memberId, role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members'] })
            toast.success('Member role updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update member role');
        },
    })
}
