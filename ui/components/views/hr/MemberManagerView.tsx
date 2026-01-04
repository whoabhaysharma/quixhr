"use client"

import { InviteUserModal } from '@/components/members/InviteUserModal'
import { AssignCalendarModal } from '@/components/members/AssignCalendarModal'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/context/auth-context"
import {
    Users,
    Mail,
    Shield,
    MoreHorizontal,
    Trash2,
    UserCog,
    Search,
    XCircle,
    Calendar,
} from "lucide-react"
import { useMembers, useDeleteMember, useUpdateMemberRole, useInvitations, useResendInvitation, useDeleteInvitation } from "@/lib/hooks/useMembers"
import { Member } from "@/lib/services/members"
import { Invitation } from "@/lib/services/invitation"
import { Role, ROLE_LABELS, ROLE_BADGE_STYLES } from "@/lib/constants/roles"

export default function MemberManagerView() {
    const { user: currentUser } = useAuth()
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [itemToDelete, setItemToDelete] = useState<{ id: string, name: string, type: 'MEMBER' | 'INVITE' } | null>(null)
    const [calendarModalState, setCalendarModalState] = useState<{ isOpen: boolean, memberId: string | null, memberName: string }>({ isOpen: false, memberId: null, memberName: '' })

    // TanStack Query hooks
    // TanStack Query hooks
    const { data: membersResponse, isLoading: isLoadingMembers } = useMembers()
    const members = (membersResponse?.data as any)?.data || []

    // Invitations hook
    const { data: invitations = [], isLoading: isLoadingInvitations } = useInvitations()
    const pendingInvitations = invitations.filter((i: any) => i.status === 'PENDING')

    const deleteMemberMutation = useDeleteMember()
    const updateMemberRoleMutation = useUpdateMemberRole()
    const resendInvitationMutation = useResendInvitation()
    const deleteInvitationMutation = useDeleteInvitation()

    const isLoading = isLoadingMembers || isLoadingInvitations

    // Combine members and pending invitations
    const allUsers = [
        ...pendingInvitations.map((inv: any) => ({
            id: inv.id,
            name: 'Invited User', // Invitations might not have name depending on schema, mostly email
            email: inv.email,
            role: inv.role,
            status: 'PENDING',
            isInvitation: true
        })),
        ...members
    ]

    // ... members array construction

    // ... (keep surrounding code)

    const admins = members.filter((m: Member) => m.role === Role.SUPER_ADMIN || m.role === Role.HR_ADMIN)
    const adminCount = admins.length

    const getRoleBadge = (role: string) => {
        // Fallback or explicit mapping
        const roleKey = role as Role;
        const style = ROLE_BADGE_STYLES[roleKey] || ROLE_BADGE_STYLES[Role.EMPLOYEE];
        const label = ROLE_LABELS[roleKey] || role;

        return (
            <Badge className={style}>
                {role === Role.SUPER_ADMIN && <Shield className="w-3 h-3 mr-1" />}
                {label}
            </Badge>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Team Members</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Manage your organization's users and access controls.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        onClick={() => setIsAddModalOpen(true)}
                    >
                        <Mail className="w-4 h-4 mr-2" />
                        Invite Member
                    </Button>

                    <InviteUserModal
                        open={isAddModalOpen}
                        onOpenChange={setIsAddModalOpen}
                        onSuccess={() => {
                            // Invalidate query to refresh list if needed
                        }}
                    />
                </div>
            </div>

            {/* Members List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                        Team Directory ({allUsers.length})
                    </h2>
                    <div className="relative w-full max-w-xs hidden sm:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search members..."
                            className="pl-9 h-9 bg-white"
                        />
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                    <Table>
                        <TableHeader className="bg-slate-50 border-b border-slate-100">
                            <TableRow className="hover:bg-transparent border-slate-100">
                                <TableHead className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">User</TableHead>
                                <TableHead className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Email Address</TableHead>
                                <TableHead className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Role</TableHead>
                                <TableHead className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</TableHead>
                                <TableHead className="px-6 py-3 text-right"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-slate-100">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i} className="border-slate-100">
                                        <TableCell className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Skeleton className="h-8 w-8 rounded-lg" />
                                                <Skeleton className="h-4 w-32" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4"><Skeleton className="h-4 w-48" /></TableCell>
                                        <TableCell className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                        <TableCell className="px-6 py-4"><Skeleton className="h-4 w-16" /></TableCell>
                                        <TableCell className="px-6 py-4 text-right"><Skeleton className="h-8 w-8 rounded-md ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : allUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="p-12 text-center text-slate-500">
                                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Users className="w-6 h-6 text-slate-400" />
                                        </div>
                                        <p>No members found</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                allUsers.map((user: any) => (
                                    <TableRow key={user.id} className="hover:bg-slate-50 transition-colors group border-slate-100">
                                        <TableCell className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8 rounded-lg border border-slate-200">
                                                    <AvatarFallback className="bg-slate-100 text-slate-600 font-bold text-xs">
                                                        {user.name ? user.name.charAt(0) : '?'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <span className="font-semibold text-slate-900 block">{user.name}</span>
                                                    {user.isInvitation && <span className="text-[10px] text-slate-400 font-normal">Pending Invite</span>}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-slate-500 text-sm">{user.email}</TableCell>
                                        <TableCell className="px-6 py-4">
                                            {getRoleBadge(user.role)}
                                        </TableCell>
                                        <TableCell className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${user.status === 'ACTIVE' ? 'bg-emerald-500' : user.status === 'PENDING' ? 'bg-amber-500' : 'bg-slate-300'}`}></span>
                                                <span className={`${user.status === 'ACTIVE' ? 'text-emerald-700' : user.status === 'PENDING' ? 'text-amber-700' : 'text-slate-500'} font-medium text-xs`}>
                                                    {user.status || 'Active'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-900 h-8 w-8 rounded-md hover:bg-slate-100"
                                                        disabled={(updateMemberRoleMutation.isPending && updateMemberRoleMutation.variables?.memberId === user.id) ||
                                                            (deleteMemberMutation.isPending && deleteMemberMutation.variables === user.id) ||
                                                            (resendInvitationMutation.isPending && resendInvitationMutation.variables === user.id) ||
                                                            (deleteInvitationMutation.isPending && deleteInvitationMutation.variables === user.id) ||
                                                            (currentUser?.role !== 'SUPER_ADMIN' && currentUser?.role !== 'HR_ADMIN')
                                                        }>
                                                        {(updateMemberRoleMutation.isPending && updateMemberRoleMutation.variables?.memberId === user.id) ||
                                                            (deleteMemberMutation.isPending && deleteMemberMutation.variables === user.id) ||
                                                            (resendInvitationMutation.isPending && resendInvitationMutation.variables === user.id) ||
                                                            (deleteInvitationMutation.isPending && deleteInvitationMutation.variables === user.id) ? (
                                                            <Spinner className="w-4 h-4" />
                                                        ) : (
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        )}
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />

                                                    {user.isInvitation ? (
                                                        <>
                                                            <DropdownMenuItem
                                                                onClick={() => resendInvitationMutation.mutate(user.id)}
                                                                className="cursor-pointer"
                                                            >
                                                                <Mail className="w-4 h-4 mr-2" />
                                                                Resend Invite
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setItemToDelete({ id: user.id, name: user.email, type: 'INVITE' })
                                                                }}
                                                                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                                                            >
                                                                <Trash2 className="w-4 h-4 mr-2" />
                                                                Remove Invite
                                                            </DropdownMenuItem>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <DropdownMenuSub>
                                                                <DropdownMenuSubTrigger>
                                                                    <UserCog className="w-4 h-4 mr-2" />
                                                                    Change Role
                                                                </DropdownMenuSubTrigger>
                                                                <DropdownMenuSubContent>
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            updateMemberRoleMutation.mutate({
                                                                                memberId: user.id,
                                                                                role: 'HR_ADMIN'
                                                                            })
                                                                        }}
                                                                        className="cursor-pointer"
                                                                        disabled={user.role === 'HR_ADMIN' || updateMemberRoleMutation.isPending}
                                                                    >
                                                                        <Shield className="w-4 h-4 mr-2" />
                                                                        HR Admin
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            updateMemberRoleMutation.mutate({
                                                                                memberId: user.id,
                                                                                role: 'MANAGER'
                                                                            })
                                                                        }}
                                                                        className="cursor-pointer"
                                                                        disabled={user.role === 'MANAGER' || updateMemberRoleMutation.isPending}
                                                                    >
                                                                        <Users className="w-4 h-4 mr-2" />
                                                                        Manager
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            updateMemberRoleMutation.mutate({
                                                                                memberId: user.id,
                                                                                role: 'EMPLOYEE'
                                                                            })
                                                                        }}
                                                                        className="cursor-pointer"
                                                                        disabled={user.role === 'EMPLOYEE' || updateMemberRoleMutation.isPending || (user.role === 'HR_ADMIN' && adminCount === 1)}
                                                                    >
                                                                        <Users className="w-4 h-4 mr-2" />
                                                                        Employee
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuSubContent>
                                                            </DropdownMenuSub>
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setCalendarModalState({ isOpen: true, memberId: user.id, memberName: user.name })
                                                                }}
                                                                className="cursor-pointer"
                                                            >
                                                                <Calendar className="w-4 h-4 mr-2" />
                                                                Assign Calendar
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setItemToDelete({ id: user.id, name: user.name, type: 'MEMBER' })
                                                                }}
                                                                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                                                                disabled={deleteMemberMutation.isPending || (user.role === 'HR_ADMIN' && adminCount === 1)}
                                                            >
                                                                <Trash2 className="w-4 h-4 mr-2" />
                                                                Remove Member
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Calendar Assignment Modal */}
            <AssignCalendarModal
                open={calendarModalState.isOpen}
                onOpenChange={(open) => setCalendarModalState(prev => ({ ...prev, isOpen: open }))}
                memberId={calendarModalState.memberId}
                memberName={calendarModalState.memberName}
            />

            <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently remove
                            <span className="font-bold text-slate-900"> {itemToDelete?.name} </span>
                            from your organization.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (itemToDelete?.type === 'MEMBER') {
                                    deleteMemberMutation.mutate(itemToDelete.id)
                                } else if (itemToDelete?.type === 'INVITE') {
                                    deleteInvitationMutation.mutate(itemToDelete.id)
                                }
                                setItemToDelete(null)
                            }}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
