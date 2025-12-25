"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
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
import { useAuth } from "@/context/auth-context"
import {
    Users,
    Mail,
    Shield,
    MoreHorizontal,
    Trash2,
    UserCog,
    Search,
    ChevronDown
} from "lucide-react"
import { useMembers, useSendInvite, useDeleteMember, useUpdateMemberRole } from "@/lib/hooks/useMembers"

export default function MemberManagerView() {
    const { logout, user: currentUser } = useAuth()
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [error, setError] = useState("")

    // Form State
    const [newEmail, setNewEmail] = useState("")
    const [newRole, setNewRole] = useState("EMPLOYEE")

    // TanStack Query hooks
    const { data: members = [], isLoading } = useMembers()
    const sendInviteMutation = useSendInvite()
    const deleteMemberMutation = useDeleteMember()
    const updateMemberRoleMutation = useUpdateMemberRole()

    const admins = members.filter((m: any) => m.role === 'ADMIN')
    const adminCount = admins.length

    const handleInviteMember = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        try {
            await sendInviteMutation.mutateAsync({
                email: newEmail,
                role: newRole as 'ADMIN' | 'HR' | 'EMPLOYEE'
            })

            // Success
            setIsAddModalOpen(false)
            setNewEmail("")
            setNewRole("EMPLOYEE")
        } catch (err: any) {
            setError(err.response?.data?.error?.message || err.message)
        }
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
                    <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                <Mail className="w-4 h-4 mr-2" />
                                Invite Member
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Invite New Member</DialogTitle>
                                <DialogDescription>
                                    Send an email invitation to join the team.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleInviteMember} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={newEmail}
                                        onChange={e => setNewEmail(e.target.value)}
                                        placeholder="colleague@company.com"
                                        className="h-9"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Role</Label>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" className="w-full justify-between h-9 font-normal text-slate-900">
                                                {newRole === 'EMPLOYEE' ? 'Employee' : newRole === 'HR' ? 'HR Manager' : 'Administrator'}
                                                <ChevronDown className="w-4 h-4 opacity-50" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-[var(--radix-popover-trigger-width)]" align="start">
                                            <DropdownMenuItem onClick={() => setNewRole("EMPLOYEE")}>
                                                <Users className="w-4 h-4 mr-2 opacity-50" />
                                                Employee
                                            </DropdownMenuItem>
                                            {currentUser?.role === 'ADMIN' && (
                                                <DropdownMenuItem onClick={() => setNewRole("HR")}>
                                                    <UserCog className="w-4 h-4 mr-2 opacity-50" />
                                                    HR Manager
                                                </DropdownMenuItem>
                                            )}
                                            {currentUser?.role === 'ADMIN' && (
                                                <DropdownMenuItem onClick={() => setNewRole("ADMIN")}>
                                                    <Shield className="w-4 h-4 mr-2 opacity-50" />
                                                    Administrator
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {error && (
                                    <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs font-medium border border-red-100">
                                        {error}
                                    </div>
                                )}

                                <div className="flex justify-end gap-2 pt-2">
                                    <Button
                                        type="button"
                                        onClick={() => setIsAddModalOpen(false)}
                                        variant="ghost"
                                        size="sm"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={sendInviteMutation.isPending}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                        size="sm"
                                    >
                                        {sendInviteMutation.isPending ? "Sending..." : "Send Invite"}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Members List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                        Team Directory ({members.length})
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
                            ) : members.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="p-12 text-center text-slate-500">
                                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Users className="w-6 h-6 text-slate-400" />
                                        </div>
                                        <p>No members found</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                members.map((user: any) => (
                                    <TableRow key={user.id} className="hover:bg-slate-50 transition-colors group border-slate-100">
                                        <TableCell className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8 rounded-lg border border-slate-200">
                                                    <AvatarFallback className="bg-slate-100 text-slate-600 font-bold text-xs">
                                                        {user.name.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="font-semibold text-slate-900">{user.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-slate-500 text-sm">{user.email}</TableCell>
                                        <TableCell className="px-6 py-4">
                                            <Badge className={`
                                                    font-bold border-none px-2.5 py-0.5 text-[10px] uppercase tracking-wide rounded-md shadow-none
                                                    ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                                                    user.role === 'HR' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-slate-100 text-slate-600'}
                                                `}>
                                                {user.role === 'ADMIN' && <Shield className="w-3 h-3 mr-1" />}
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                                <span className="text-emerald-700 font-medium text-xs">Active</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-900 h-8 w-8 rounded-md hover:bg-slate-100"
                                                        disabled={(updateMemberRoleMutation.isPending && updateMemberRoleMutation.variables?.memberId === user.id) ||
                                                            (deleteMemberMutation.isPending && deleteMemberMutation.variables === user.id) ||
                                                            currentUser?.role !== 'ADMIN' && user.role === 'ADMIN'
                                                        }>
                                                        {(updateMemberRoleMutation.isPending && updateMemberRoleMutation.variables?.memberId === user.id) ||
                                                            (deleteMemberMutation.isPending && deleteMemberMutation.variables === user.id) ? (
                                                            <Spinner className="w-4 h-4" />
                                                        ) : (
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        )}
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuSub>
                                                        <DropdownMenuSubTrigger>
                                                            <UserCog className="w-4 h-4 mr-2" />
                                                            Change Role
                                                        </DropdownMenuSubTrigger>
                                                        <DropdownMenuSubContent>
                                                            {currentUser?.role === 'ADMIN' && (
                                                                <DropdownMenuItem
                                                                    onClick={() => {
                                                                        updateMemberRoleMutation.mutate({
                                                                            memberId: user.id,
                                                                            role: 'ADMIN'
                                                                        })
                                                                    }}
                                                                    className="cursor-pointer"
                                                                    disabled={user.role === 'ADMIN' || updateMemberRoleMutation.isPending}
                                                                >
                                                                    <Shield className="w-4 h-4 mr-2" />
                                                                    Admin
                                                                    {user.role === 'ADMIN' && <span className="ml-auto text-xs text-slate-400">Current</span>}
                                                                </DropdownMenuItem>
                                                            )}
                                                            {currentUser?.role === 'ADMIN' && (
                                                                <DropdownMenuItem
                                                                    onClick={() => {
                                                                        updateMemberRoleMutation.mutate({
                                                                            memberId: user.id,
                                                                            role: 'HR'
                                                                        })
                                                                    }}
                                                                    className="cursor-pointer"
                                                                    disabled={user.role === 'HR' || updateMemberRoleMutation.isPending || (user.role === 'ADMIN' && adminCount === 1)}
                                                                >
                                                                    <UserCog className="w-4 h-4 mr-2" />
                                                                    HR Manager
                                                                    {user.role === 'HR' && <span className="ml-auto text-xs text-slate-400">Current</span>}
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    updateMemberRoleMutation.mutate({
                                                                        memberId: user.id,
                                                                        role: 'EMPLOYEE'
                                                                    })
                                                                }}
                                                                className="cursor-pointer"
                                                                disabled={user.role === 'EMPLOYEE' || updateMemberRoleMutation.isPending || (user.role === 'ADMIN' && adminCount === 1)}
                                                            >
                                                                <Users className="w-4 h-4 mr-2" />
                                                                Employee
                                                                {user.role === 'EMPLOYEE' && <span className="ml-auto text-xs text-slate-400">Current</span>}
                                                            </DropdownMenuItem>
                                                        </DropdownMenuSubContent>
                                                    </DropdownMenuSub>
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            if (confirm(`Are you sure you want to remove ${user.name}?`)) {
                                                                deleteMemberMutation.mutate(user.id)
                                                            }
                                                        }}
                                                        className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                                                        disabled={deleteMemberMutation.isPending || (user.role === 'ADMIN' && adminCount === 1)}
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Remove Member
                                                    </DropdownMenuItem>
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
        </div>
    )
}
