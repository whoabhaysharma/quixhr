"use client"

import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { formatRole } from "@/lib/utils/formatters"
import { format } from "date-fns"
import { Mail, Building2, Calendar, Shield, User } from "lucide-react"

export function ProfileView() {
    const { user } = useAuth()

    if (!user) return null

    const initials = user.employee?.firstName
        ? user.employee.firstName.charAt(0)
        : user.user.email.charAt(0).toUpperCase()

    const fullName = user.employee
        ? `${user.employee.firstName} ${user.employee.lastName}`.trim()
        : "User"

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Profile</h2>
                <p className="text-slate-500">Manage your account settings and preferences.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Basic details about your account.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* Header with Avatar */}
                    <div className="flex items-center gap-6">
                        <Avatar className="h-24 w-24 border-4 border-white shadow-lg ring-1 ring-slate-200">
                            <AvatarImage src="" /> {/* Add avatar URL if available later */}
                            <AvatarFallback className="bg-slate-900 text-white text-3xl font-bold">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold text-slate-900">{fullName}</h3>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                                    <Building2 className="h-4 w-4" />
                                    {user.organization?.name || "No Organization"}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="font-semibold text-slate-600">
                                        {formatRole(user.user.role)}
                                    </Badge>
                                    {user.employee?.status && (
                                        <Badge className={user.employee.status === 'ACTIVE' ? "bg-emerald-500 hover:bg-emerald-600" : "bg-slate-500"}>
                                            {user.employee.status}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                <Input disabled value={user.user.email} className="pl-9 bg-slate-50/50" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Organization</Label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                <Input disabled value={user.organization?.name || "N/A"} className="pl-9 bg-slate-50/50" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Role</Label>
                            <div className="relative">
                                <Shield className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                <Input disabled value={formatRole(user.user.role)} className="pl-9 bg-slate-50/50" />
                            </div>
                        </div>

                        {user.employee?.joiningDate && (
                            <div className="space-y-2">
                                <Label>Joined On</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                    <Input
                                        disabled
                                        value={format(new Date(user.employee.joiningDate), 'MMMM dd, yyyy')}
                                        className="pl-9 bg-slate-50/50"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
