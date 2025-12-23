"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/context/auth-context"
import {
    Users,
    UserPlus,
    MoreVertical,
    Mail,
    Shield,
    MoreHorizontal
} from "lucide-react"

interface User {
    id: number
    name: string
    email: string
    role: string
    organizationId: number
}

export default function MembersPage() {
    const { logout } = useAuth()
    const [allUsers, setAllUsers] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState("")

    // Form State
    const [newName, setNewName] = useState("")
    const [newEmail, setNewEmail] = useState("")
    const [newRole, setNewRole] = useState("EMPLOYEE")

    const fetchMembers = async () => {
        setIsLoading(true)
        try {
            const token = localStorage.getItem("token")
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/members`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            const data = await response.json()
            if (response.ok) {
                setAllUsers(data.data.users)
            } else {
                console.error("Failed to fetch members", data)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchMembers()
    }, [])

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError("")

        try {
            const token = localStorage.getItem("token")
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/members`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: newName,
                    email: newEmail,
                    role: newRole
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error?.message || "Failed to add member")
            }

            // Success
            setIsAddModalOpen(false)
            setNewName("")
            setNewEmail("")
            setNewRole("EMPLOYEE")
            fetchMembers()

        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 pb-12">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Team Members</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Manage your organization's users and access controls.</p>
                </div>
                <Button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-slate-900 text-white hover:bg-slate-800 px-6 h-10 shadow-sm font-semibold"
                >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Member
                </Button>
            </div>

            {/* Members List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 text-[10px]">Team Directory</h2>
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                        Total: {allUsers.length}
                    </span>
                </div>

                <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50/50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</th>
                                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-slate-500">Loading directory...</td>
                                    </tr>
                                ) : allUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-slate-400">
                                            <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                            <p>No members found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    allUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8 rounded-lg border border-slate-200">
                                                        <AvatarFallback className="bg-slate-100 text-slate-600 font-bold text-xs">
                                                            {user.name.charAt(0)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-bold text-slate-800">{user.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 font-medium">{user.email}</td>
                                            <td className="px-6 py-4">
                                                <Badge className={`
                                                    font-bold border-none px-2.5 py-0.5 text-[9px] uppercase tracking-widest
                                                    ${user.role === 'ADMIN' ? 'bg-purple-50 text-purple-700' :
                                                        user.role === 'HR' ? 'bg-blue-50 text-blue-700' :
                                                            'bg-slate-100 text-slate-600'}
                                                `}>
                                                    {user.role === 'ADMIN' && <Shield className="w-3 h-3 mr-1" />}
                                                    {user.role}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                    <span className="text-emerald-700 font-bold text-xs">Active</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-900 h-8 w-8 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Add Member Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <Card className="w-full max-w-md bg-white border-0 shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 duration-200">
                        <CardHeader className="border-b border-slate-100 pb-4">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg font-bold text-slate-900">Add New Member</CardTitle>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-400 hover:text-slate-900 rounded-full"
                                    onClick={() => setIsAddModalOpen(false)}
                                >
                                    <MoreVertical className="w-4 h-4 rotate-90" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <form onSubmit={handleAddMember} className="space-y-4">
                                <div>
                                    <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-500">Name</Label>
                                    <Input
                                        id="name"
                                        value={newName}
                                        onChange={e => setNewName(e.target.value)}
                                        placeholder="Full Name"
                                        className="mt-1.5 rounded-lg border-slate-200 focus:ring-slate-900"
                                        required
                                    />
                                </div>
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
                                        disabled={isSubmitting}
                                        className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg font-semibold"
                                    >
                                        {isSubmitting ? 'Adding...' : 'Add Member'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
