import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { membersService } from '../services/members'

export function useMembers() {
    return useQuery({
        queryKey: ['members'],
        queryFn: async () => {
            const response = await membersService.getAllMembers()
            return response.data.members
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
        },
    })
}

export function useDeleteMember() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (memberId: string) => membersService.deleteMember(memberId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members'] })
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
        },
    })
}
