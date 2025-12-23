"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
    UserPlus,
    MoreVertical,
    Mail,
    Shield,
    MoreHorizontal
} from "lucide-react"
import { useMembers, useSendInvite } from "@/lib/hooks/useMembers"

interface User {
    id: number
    name: string
    email: string
    role: string
    organizationId: number
}

export default function MembersPage() {
    const { logout } = useAuth()
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [error, setError] = useState("")

    // Form State
    const [newEmail, setNewEmail] = useState("")
    const [newRole, setNewRole] = useState("EMPLOYEE")

    // TanStack Query hooks
    const { data: members = [], isLoading } = useMembers()
    const sendInviteMutation = useSendInvite()

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
            alert("Invitation sent successfully!")
        } catch (err: any) {
            setError(err.response?.data?.error?.message || err.message)
        }
    }

    return (
        <div className="-m-4 lg:-m-8 bg-[#f8fafc] min-h-[calc(100vh-4rem)] pb-20">
            <div className="max-w-[1400px] mx-auto px-6 pt-8 space-y-8">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Team Members</h1>
                        <p className="text-slate-500 text-sm max-w-2xl leading-relaxed italic">
                            Manage your organization's users and access controls.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 border-none"
                        >
                            <Mail className="w-4 h-4 mr-2" />
                            Invite Member
                        </Button>
                    </div>
                </div>

                {/* Members List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            Team Directory
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                                {members.length} Total
                            </span>
                        </h2>
                    </div>

                    <Card className="border-none shadow-sm overflow-hidden bg-white">
                        <Table>
                            <TableHeader className="bg-slate-50 border-b border-slate-100">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">User</TableHead>
                                    <TableHead className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Email Address</TableHead>
                                    <TableHead className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Role</TableHead>
                                    <TableHead className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</TableHead>
                                    <TableHead className="px-6 py-3 text-right"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-slate-100">
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="p-8 text-center text-slate-500">Loading directory...</TableCell>
                                    </TableRow>
                                ) : members.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="p-12 text-center text-slate-400">
                                            <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                            <p>No members found</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    members.map((user: any) => (
                                        <TableRow key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <TableCell className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8 rounded-lg border border-slate-200">
                                                        <AvatarFallback className="bg-slate-100 text-slate-600 font-bold text-xs">
                                                            {user.name.charAt(0)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-bold text-slate-800">{user.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-slate-500 font-medium">{user.email}</TableCell>
                                            <TableCell className="px-6 py-4">
                                                <Badge className={`
                                                    font-bold border-none px-2.5 py-0.5 text-[10px] uppercase tracking-tight rounded-full flex items-center gap-1 w-fit
                                                    ${user.role === 'ADMIN' ? 'bg-purple-50 text-purple-700' :
                                                        user.role === 'HR' ? 'bg-blue-50 text-blue-700' :
                                                            'bg-slate-100 text-slate-600'}
                                                `}>
                                                    {user.role === 'ADMIN' && <Shield className="w-3 h-3" />}
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                    <span className="text-emerald-700 font-bold text-xs">Active</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-right">
                                                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-900 h-8 w-8 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </div>
            </div>



            {/* Invite Member Dialog */}
            < Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen} >
                <DialogContent className="sm:max-w-md bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-slate-900">Invite New Member</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleInviteMember} className="space-y-4 pt-2">
                        {/* Name field removed */}
                        <div>
                            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-500">Email</Label>
                            <div className="relative mt-1.5">
                                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    value={newEmail}
                                    onChange={e => setNewEmail(e.target.value)}
                                    placeholder="email@company.com"
                                    className="pl-9 rounded-lg border-slate-200 focus:ring-slate-900"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="role" className="text-xs font-bold uppercase tracking-wider text-slate-500">Role</Label>
                            <select
                                id="role"
                                value={newRole}
                                onChange={e => setNewRole(e.target.value)}
                                className="w-full h-10 px-3 py-2 mt-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                            >
                                <option value="EMPLOYEE">Employee</option>
                                <option value="HR">HR Manager</option>
                                <option value="ADMIN">Administrator</option>
                            </select>
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-rose-50 text-rose-600 text-sm border border-rose-100 font-medium">
                                {error}
                            </div>
                        )}

                        <div className="pt-4 flex justify-end gap-3">
                            <Button
                                type="button"
                                onClick={() => setIsAddModalOpen(false)}
                                variant="outline"
                                className="rounded-xl border-slate-200 font-semibold"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={sendInviteMutation.isPending}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 font-semibold"
                            >
                                {sendInviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
