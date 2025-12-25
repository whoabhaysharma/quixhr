"use client"


import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Skeleton } from "@/components/ui/skeleton"
import { Timer, Calendar, UserPlus, FileText, Sparkles, ChevronRight, Zap, Clock, CheckCircle } from "lucide-react"
import { format, differenceInHours, differenceInMinutes, parseISO } from "date-fns"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as attendanceService from "@/lib/services/attendance"
import { useState, useEffect } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function WelcomeBanner({ name, role }: { name: string, role: string }) {
    return (
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-8 py-8 shadow-xl">
            <div className="relative z-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Badge variant="outline" className="mb-3 border-indigo-400/30 text-indigo-300 bg-indigo-500/10 uppercase tracking-widest text-[10px] font-bold">
                        {role} Dashboard
                    </Badge>
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                        Good Morning, {name?.split(' ')[0]}!
                    </h1>
                    <p className="mt-2 text-slate-400 max-w-lg leading-relaxed">
                        Here's what's happening in your organization today. You have <span className="text-white font-semibold">4 pending requests</span> requiring your attention.
                    </p>
                </div>
                <div className="hidden sm:block">
                    <Button className="bg-white text-slate-900 hover:bg-slate-50 font-bold border-none">
                        View Reports
                        <ChevronRight className="w-4 h-4 ml-2 opacity-50" />
                    </Button>
                </div>
            </div>
            {/* Decorative Background Elements */}
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="absolute top-1/2 left-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 bg-[url('/grid.svg')] opacity-[0.03]" />
        </div>
    )
}

export function StatCard({ label, value, icon: Icon, trend, color = "text-slate-900", alert = false }: any) {
    return (
        <div className="relative overflow-hidden border-none shadow-lg shadow-slate-200/50 bg-white ring-1 ring-slate-100 hover:ring-indigo-100 transition-all duration-300 group rounded-xl">
            <div className="p-6 relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">{label}</p>
                        <h3 className={`text-4xl font-extrabold tracking-tight ${color} mt-2`}>{value}</h3>
                    </div>
                    <div className={`p-3 rounded-2xl ${alert ? 'bg-amber-100 text-amber-600' : 'bg-slate-50 text-slate-400'} group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-6 h-6" />
                    </div>
                </div>

                {trend && (
                    <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                            <span>↑</span> 12%
                        </div>
                        <span className="text-[11px] font-medium text-slate-400">{trend}</span>
                    </div>
                )}
            </div>

            {/* Decorative Background Elements */}
            <div className="absolute right-0 top-0 h-32 w-32 bg-gradient-to-br from-indigo-50/50 to-transparent rounded-bl-full -mr-10 -mt-10 transition-all group-hover:from-indigo-100/50" />
            {alert && <div className="absolute bottom-0 right-0 h-16 w-16 bg-amber-500/10 blur-2xl rounded-full" />}
        </div>
    )
}

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function PendingActionsWidget({ leaves }: { leaves: any[] }) {
    if (!leaves || leaves.length === 0) {
        return (
            <div className="border-none shadow-lg shadow-slate-200/50 bg-white ring-1 ring-slate-100 rounded-xl">
                <div className="p-4 border-b border-slate-50/50 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-indigo-500" />
                        Pending Actions
                    </h3>
                </div>
                <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                        <CheckCircle className="w-6 h-6 text-emerald-500/50" />
                    </div>
                    <p className="text-sm font-medium text-slate-600">All caught up!</p>
                    <p className="text-xs">No pending requests at the moment.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="border-none shadow-lg shadow-slate-200/50 bg-white ring-1 ring-slate-100 overflow-hidden rounded-xl">
            <div className="p-4 border-b border-slate-50/50 bg-slate-50/30 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    Pending Actions
                </h3>
                <Button variant="ghost" size="sm" className="h-8 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 uppercase tracking-wide">
                    View All
                </Button>
            </div>
            <Table>
                <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent border-slate-50">
                        <TableHead className="px-6 py-3 h-auto text-[10px] uppercase font-bold text-slate-400 tracking-wider">Employee</TableHead>
                        <TableHead className="px-6 py-3 h-auto text-[10px] uppercase font-bold text-slate-400 tracking-wider">Request</TableHead>
                        <TableHead className="px-6 py-3 h-auto text-right text-[10px] uppercase font-bold text-slate-400 tracking-wider">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {leaves.slice(0, 5).map((leave: any) => (
                        <TableRow key={leave.id} className="hover:bg-slate-50/50 transition-colors group border-slate-50">
                            <TableCell className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9 border border-white shadow-sm ring-1 ring-slate-100">
                                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-500 text-white text-xs font-bold">
                                            {leave.user?.name?.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-bold text-slate-700 text-sm leading-none">{leave.user?.name}</p>
                                        <p className="text-[10px] font-semibold text-slate-400 mt-1">{leave.user?.email}</p>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="px-6 py-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 uppercase tracking-tight">
                                        {leave.type}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                    <Calendar className="w-3 h-3 text-slate-400" />
                                    {format(new Date(leave.startDate), "MMM d")} - {format(new Date(leave.endDate), "MMM d")}
                                </div>
                            </TableCell>
                            <TableCell className="px-6 py-4 text-right">
                                <Button size="sm" variant="outline" className="h-8 px-3 text-xs font-semibold border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-colors">
                                    Review
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

export function LeaveDistributionWidget({ data }: { data: any[] }) {
    if (!data) return null;

    // Sort by count descending
    const sorted = [...data].sort((a, b) => b._count.id - a._count.id);
    const total = sorted.reduce((sum, item) => sum + item._count.id, 0);

    return (
        <div className="border-none shadow-lg shadow-slate-200/50 bg-white ring-1 ring-slate-100 h-full rounded-xl">
            <div className="p-4 border-b border-slate-50/50">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    Leave Insights
                </h3>
            </div>
            <div className="p-6 pt-6 space-y-6">
                {sorted.map((item) => {
                    const percent = total > 0 ? (item._count.id / total) * 100 : 0;
                    return (
                        <div key={item.type} className="group">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-xs font-bold text-slate-700 capitalize flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                    {item.type.toLowerCase().replace('_', ' ')}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                    {item._count.id} requests
                                </span>
                            </div>
                            <div className="h-2.5 w-full bg-slate-50 rounded-full overflow-hidden shadow-inner">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 opacity-90 group-hover:opacity-100 transition-all duration-500 shadow-sm"
                                    style={{ width: `${percent}%` }}
                                />
                            </div>
                        </div>
                    )
                })}
                {sorted.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-sm">No leave data available</div>
                )}
            </div>
        </div>
    )
}

export function RecentJoinersCard({ users }: { users: any[] }) {
    if (!users || users.length === 0) return null;

    return (
        <div className="border-none shadow-lg shadow-slate-200/50 bg-white ring-1 ring-slate-100 h-full rounded-xl">
            <div className="p-4 border-b border-slate-50/50 bg-slate-50/30 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-indigo-500" />
                    New Team Members
                </h3>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full hover:bg-indigo-50 text-slate-400 hover:text-indigo-600">
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </div>
            <div className="p-0">
                <div className="divide-y divide-slate-50">
                    {users.map((user) => (
                        <div key={user.id} className="flex items-center gap-4 p-4 hover:bg-slate-50/40 transition-colors group cursor-pointer">
                            <div className="relative">
                                <Avatar className="h-10 w-10 border-2 border-white shadow-sm ring-1 ring-slate-100 group-hover:scale-105 transition-transform">
                                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold">
                                        {user.name?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-700 transition-colors">{user.name}</p>
                                <p className="text-[10px] font-medium text-slate-400 truncate mt-0.5">{user.email}</p>
                            </div>

                            <div className="text-right shrink-0">
                                <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-bold text-[9px] uppercase tracking-wide border-none group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                    New
                                </Badge>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}



export function QuickActionsCard() {
    return (
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200">
            <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-indigo-200" />
                <h3 className="font-bold text-lg">Quick Actions</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <Button variant="secondary" className="w-full justify-start bg-white/10 hover:bg-white/20 text-white border-none h-auto py-3 px-4 rounded-xl backdrop-blur-sm">
                    <span className="text-left">
                        <span className="block text-xs font-bold opacity-75 uppercase mb-0.5">Add</span>
                        <span className="block font-bold">Employee</span>
                    </span>
                </Button>
                <Button variant="secondary" className="w-full justify-start bg-white/10 hover:bg-white/20 text-white border-none h-auto py-3 px-4 rounded-xl backdrop-blur-sm">
                    <span className="text-left">
                        <span className="block text-xs font-bold opacity-75 uppercase mb-0.5">Post</span>
                        <span className="block font-bold">Update</span>
                    </span>
                </Button>
                <Button variant="secondary" className="w-full justify-start bg-white/10 hover:bg-white/20 text-white border-none h-auto py-3 px-4 rounded-xl backdrop-blur-sm">
                    <span className="text-left">
                        <span className="block text-xs font-bold opacity-75 uppercase mb-0.5">Payroll</span>
                        <span className="block font-bold">Run</span>
                    </span>
                </Button>
                <Button variant="secondary" className="w-full justify-start bg-white/10 hover:bg-white/20 text-white border-none h-auto py-3 px-4 rounded-xl backdrop-blur-sm">
                    <span className="text-left">
                        <span className="block text-xs font-bold opacity-75 uppercase mb-0.5">Policy</span>
                        <span className="block font-bold">Edit</span>
                    </span>
                </Button>
            </div>
        </div>
    )
}

export function BalanceCard({ label, current, total, color }: any) {
    const percentage = (current / total) * 100
    return (
        <div className="border border-slate-200/60 shadow-sm ring-1 ring-slate-900/5 rounded-xl bg-white">
            <div className="p-4">
                <div className="flex justify-between items-end mb-3">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                        <h3 className="text-xl font-bold text-slate-900">{current} <span className="text-slate-300 text-sm font-medium">/ {total}</span></h3>
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Days Used</p>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full`} style={{ width: `${percentage}%` }} />
                </div>
            </div>
        </div>
    )
}

export function StatusBadge({ status }: { status: string }) {
    const styles: any = {
        'APPROVED': 'bg-emerald-50 text-emerald-700 border-emerald-100',
        'PENDING': 'bg-amber-50 text-amber-700 border-amber-100',
        'REJECTED': 'bg-rose-50 text-rose-700 border-rose-100'
    }
    return (
        <Badge variant="outline" className={`${styles[status] || styles['PENDING']} border px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight`}>
            {status}
        </Badge>
    )
}

export function AvailabilityRow({ name, availability }: any) {
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-600">{name}</span>
                <span className="text-slate-400">{availability}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full">
                <div className={`h-full bg-slate-900 rounded-full`} style={{ width: `${availability}%` }} />
            </div>
        </div>
    )
}

export function HolidayItem({ date, name, subtitle }: any) {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return (
        <div className="flex items-center gap-4">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 min-w-[54px] text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">{format(dateObj, 'MMM')}</p>
                <p className="text-lg font-bold text-slate-800 leading-none">{format(dateObj, 'd')}</p>
            </div>
            <div>
                <p className="text-sm font-semibold text-slate-800">{name}</p>
                <p className="text-xs text-slate-400 font-medium">{subtitle || format(dateObj, 'EEEE')}</p>
            </div>
        </div>
    )
}

export function AttendanceWidget() {
    const queryClient = useQueryClient()
    const [currentTime, setCurrentTime] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    const { data: todayStatus, isLoading: isLoadingStatus } = useQuery({
        queryKey: ['attendance', 'today'],
        queryFn: attendanceService.getTodayStatus,
    })

    const clockInMutation = useMutation({
        mutationFn: attendanceService.clockIn,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance'] })
        },
    })

    const clockOutMutation = useMutation({
        mutationFn: attendanceService.clockOut,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance'] })
        },
    })

    const handleClockAction = () => {
        if (todayStatus?.clockIn && !todayStatus?.clockOut) {
            clockOutMutation.mutate()
        } else {
            clockInMutation.mutate()
        }
    }

    const isWorking = todayStatus?.clockIn && !todayStatus?.clockOut
    const isDayComplete = todayStatus?.clockIn && todayStatus?.clockOut

    const calculateDuration = (start: string) => {
        const startDate = new Date(start)
        const endDate = new Date()
        const hours = differenceInHours(endDate, startDate)
        const minutes = differenceInMinutes(endDate, startDate) % 60
        return `${hours}h ${minutes}m`
    }

    if (isLoadingStatus) return <Skeleton className="h-[140px] w-full rounded-xl" />

    return (
        <div className="border border-slate-200/60 shadow-sm bg-gradient-to-br from-white to-slate-50/50 h-full flex flex-col justify-between ring-1 ring-slate-900/5 group rounded-xl">
            <div className="p-5 flex items-center justify-between h-full">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2 mb-3">
                        <Timer className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time Tracker</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-mono font-bold text-slate-900 tracking-tight">
                            {format(currentTime, "HH:mm")}
                        </h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <p className={`text-xs font-semibold flex items-center gap-1.5 ${isWorking ? 'text-amber-600' : isDayComplete ? 'text-emerald-600' : 'text-slate-500'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isWorking ? 'bg-amber-500 animate-pulse' : isDayComplete ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            {isWorking ? 'Checked In' : isDayComplete ? 'Shift Completed' : 'Not Checked In'}
                        </p>
                        {isWorking && (
                            <span className="text-[10px] font-mono font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                                {calculateDuration(todayStatus.clockIn)}
                            </span>
                        )}
                    </div>
                </div>

                <Button
                    onClick={handleClockAction}
                    disabled={!!isDayComplete || clockInMutation.isPending || clockOutMutation.isPending}
                    size="sm"
                    className={`
                         px-6 h-11 text-xs font-bold shadow-sm transition-all rounded-xl
                        ${isWorking
                            ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 hover:border-rose-300'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100 hover:shadow-indigo-200'
                        }
                    `}
                >
                    {(clockInMutation.isPending || clockOutMutation.isPending) ? (
                        <Spinner className="w-4 h-4" />
                    ) : isWorking ? (
                        "Check Out"
                    ) : isDayComplete ? (
                        "Done"
                    ) : (
                        "Check In"
                    )}
                </Button>
            </div>
        </div>
    )
}
