"use client"

import { useAuth } from "@/context/auth-context"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Calendar,
    Users,
    Clock,
    Plus,
    ArrowUpRight,
    CalendarDays,
    CheckCircle2,
    AlertCircle,
    UserPlus,
    FileText,
    ChevronRight,
    Search
} from "lucide-react"
import { useAdminStats, useEmployeeStats } from "@/lib/hooks/useDashboard"
import { useLeaves } from "@/lib/hooks/useLeaves"
import { useUpcomingHolidays } from "@/lib/hooks/useHolidays"
import { format } from "date-fns"

export default function RedesignedDashboard() {
    const { user, isLoading: authLoading } = useAuth()

    // Use TanStack Query hooks based on user role
    const { data: adminStats, isLoading: adminStatsLoading } = useAdminStats()
    const { data: employeeStats, isLoading: employeeStatsLoading } = useEmployeeStats()
    const { data: leaves = [], isLoading: leavesLoading } = useLeaves(
        user?.role === 'EMPLOYEE' ? user.id : undefined
    )

    const dashboardStats = user?.role === 'EMPLOYEE' ? employeeStats : adminStats
    const isLoading = authLoading ||
        (user?.role === 'EMPLOYEE' ? employeeStatsLoading : adminStatsLoading) ||
        leavesLoading

    const recentLeaves = leaves.slice(0, 5)

    if (authLoading || isLoading) return <LoadingSkeleton />

    return (
        <div className="-m-4 lg:-m-8 bg-[#f8fafc] min-h-[calc(100vh-4rem)] pb-20">
            <div className="max-w-[1400px] mx-auto px-6 pt-8 space-y-10">
                {/* Global Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                            Good morning, {user?.name?.split(' ')[0]}
                        </h1>
                        <p className="text-slate-500 mt-1.5 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            System is up to date • {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {user?.role === 'ADMIN' ? (
                            <>
                                <Button variant="outline" className="hidden sm:flex gap-2 border-slate-200">
                                    <FileText className="w-4 h-4" /> Reports
                                </Button>
                                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-lg shadow-indigo-200 border-none">
                                    <UserPlus className="w-4 h-4" /> Add Personnel
                                </Button>
                            </>
                        ) : (
                            <Link href="/leaves/new">
                                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-lg shadow-indigo-200 border-none">
                                    <Plus className="w-4 h-4" /> Request Leave
                                </Button>
                            </Link>
                        )}
                    </div>
                </header>

                {user?.role === 'ADMIN' ?
                    <AdminView stats={dashboardStats} leaves={recentLeaves} /> :
                    <EmployeeView user={user} stats={dashboardStats} leaves={recentLeaves} />
                }
            </div>
        </div>
    )
}

/* -------------------------------------------------------------------------- */
/* ADMIN VIEW                                 */
/* -------------------------------------------------------------------------- */

function AdminView({ stats, leaves }: any) {
    return (
        <div className="space-y-8">
            {/* KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Total Employees" value={stats?.totalEmployees || 0} icon={Users} trend="Active workforce" />
                <StatCard label="On Leave Today" value={stats?.onLeaveToday || 0} icon={CalendarDays} trend="Within limit" />
                <StatCard
                    label="Pending Approval"
                    value={stats?.pendingLeaves || 0}
                    icon={Clock}
                    color="text-amber-600"
                    alert={stats?.pendingLeaves > 0}
                />
                <StatCard label="Retention Rate" value="98%" icon={ArrowUpRight} trend="Excellent" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Pipeline */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-slate-800">Leave Approvals</h3>
                        <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 font-medium">
                            View All <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>

                    <Card className="border-slate-200/60 shadow-sm overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50 border-b border-slate-100">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="py-3 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Employee</TableHead>
                                    <TableHead className="py-3 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Type / Duration</TableHead>
                                    <TableHead className="py-3 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</TableHead>
                                    <TableHead className="py-3 px-5 text-right"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-slate-50">
                                {leaves.map((leave: any) => (
                                    <TableRow key={leave.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <TableCell className="py-3 px-5">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8 border border-slate-100 shadow-sm">
                                                    <AvatarFallback className="bg-indigo-50 text-indigo-700 text-xs font-bold">
                                                        {leave.user?.name?.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-700 leading-none">{leave.user?.name}</p>
                                                    <p className="text-[10px] text-slate-400 mt-1">Product Designer</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3 px-5">
                                            <p className="text-sm font-medium text-slate-600 leading-none">{leave.type}</p>
                                            <p className="text-[10px] text-slate-400 mt-1">
                                                {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                                            </p>
                                        </TableCell>
                                        <TableCell className="py-3 px-5">
                                            <StatusBadge status={leave.status} />
                                        </TableCell>
                                        <TableCell className="py-3 px-5 text-right">
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-600">
                                                <ChevronRight className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </div>

                {/* Right Column: Insights */}
                <div className="space-y-6">
                    <Card className="border-slate-200/60 shadow-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-sm font-bold text-slate-800">Team Availability</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <AvailabilityRow name="Design Team" availability={90} />
                            <AvailabilityRow name="Engineering" availability={75} />
                            <AvailabilityRow name="Marketing" availability={100} />
                        </CardContent>
                    </Card>

                    <div className="bg-slate-900 rounded-3xl p-6 text-white relative overflow-hidden group shadow-xl">
                        <div className="relative z-10">
                            <h4 className="font-bold text-lg mb-2">Annual Policy Update</h4>
                            <p className="text-slate-400 text-sm leading-relaxed mb-6">
                                Ensure all personnel have signed the updated Q1 compliance documents by Friday.
                            </p>
                            <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 font-bold rounded-xl">
                                Send Reminder
                            </Button>
                        </div>
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-colors" />
                    </div>
                </div>
            </div>
        </div>
    )
}

/* -------------------------------------------------------------------------- */
/* EMPLOYEE VIEW                               */
/* -------------------------------------------------------------------------- */

function EmployeeView({ user, stats, leaves }: any) {
    const { data: holidays = [], isLoading: holidaysLoading } = useUpcomingHolidays(3)

    return (
        <div className="space-y-8">
            {/* Balance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <BalanceCard label="Annual Leave" current={stats?.used || 0} total={stats?.allowance || 20} color="bg-indigo-600" />
                <BalanceCard label="Pending Requests" current={stats?.pendingRequests || 0} total={5} color="bg-amber-500" />
                {/* Mocking other balances for now as we only have totalDays */}
                <BalanceCard label="Personal Time" current={1} total={2} color="bg-emerald-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-slate-800">My Leave History</h3>
                    </div>
                    <Card className="border-slate-200/60 shadow-sm overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50 border-b border-slate-100">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="py-3 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-12"></TableHead>
                                    <TableHead className="py-3 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Type</TableHead>
                                    <TableHead className="py-3 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Dates</TableHead>
                                    <TableHead className="py-3 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-slate-50">
                                {leaves.map((leave: any) => (
                                    <TableRow key={leave.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <TableCell className="py-3 px-5">
                                            <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                                                <Calendar className="w-4 h-4 text-slate-400" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3 px-5">
                                            <p className="text-sm font-semibold text-slate-800 leading-none">{leave.type || 'Annual Leave'}</p>
                                            <p className="text-[10px] text-slate-500 mt-1">Requested on {new Date(leave.createdAt).toLocaleDateString()}</p>
                                        </TableCell>
                                        <TableCell className="py-3 px-5">
                                            <p className="text-sm font-medium text-slate-600 leading-none">
                                                {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                                            </p>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight mt-1">{leave.totalDays} Days</p>
                                        </TableCell>
                                        <TableCell className="py-3 px-5">
                                            <StatusBadge status={leave.status} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="border-slate-200/60 shadow-sm">
                        <CardHeader className="border-b border-slate-50">
                            <CardTitle className="text-sm font-bold text-slate-800">Upcoming Holidays</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            {holidaysLoading ? (
                                <div className="space-y-4 animate-pulse">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="flex items-center gap-4">
                                            <div className="h-12 w-12 bg-slate-100 rounded-xl"></div>
                                            <div className="space-y-2 flex-1">
                                                <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                                                <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : holidays.length === 0 ? (
                                <p className="text-sm text-slate-500 text-center py-4">No upcoming holidays</p>
                            ) : (
                                holidays.map((holiday: any) => (
                                    <HolidayItem
                                        key={holiday.id}
                                        date={format(new Date(holiday.date), 'MMM d')}
                                        name={holiday.name}
                                        subtitle={holiday.description || "Holiday"}
                                    />
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

/* -------------------------------------------------------------------------- */
/* HELPER COMPONENTS                             */
/* -------------------------------------------------------------------------- */

function StatCard({ label, value, icon: Icon, trend, color = "text-slate-900", alert = false }: any) {
    return (
        <Card className="border-slate-200/60 shadow-sm hover:border-indigo-200 transition-all group">
            <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                        <Icon className="w-4 h-4" />
                    </div>
                    {alert && <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />}
                </div>
                <div className="space-y-0.5">
                    <h3 className={`text-xl font-bold tracking-tight ${color}`}>{value}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                </div>
                {trend && (
                    <p className="mt-3 text-[10px] font-bold text-slate-500 flex items-center gap-1.5 border-t border-slate-50 pt-2.5">
                        <span className="text-emerald-500">↑</span> {trend}
                    </p>
                )}
            </CardContent>
        </Card>
    )
}

function BalanceCard({ label, current, total, color }: any) {
    const percentage = (current / total) * 100
    return (
        <Card className="border-slate-200/60 shadow-sm">
            <CardContent className="p-4">
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
            </CardContent>
        </Card>
    )
}

function StatusBadge({ status }: { status: string }) {
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

function AvailabilityRow({ name, availability }: any) {
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

function HolidayItem({ date, name, subtitle }: any) {
    return (
        <div className="flex items-center gap-4">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 min-w-[54px] text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">{date.split(' ')[0]}</p>
                <p className="text-lg font-bold text-slate-800 leading-none">{date.split(' ')[1]}</p>
            </div>
            <div>
                <p className="text-sm font-semibold text-slate-800">{name}</p>
                <p className="text-xs text-slate-400 font-medium">{subtitle}</p>
            </div>
        </div>
    )
}

function LoadingSkeleton() {
    return (
        <div className="p-10 space-y-10 max-w-[1600px] mx-auto animate-pulse">
            <div className="flex justify-between items-center">
                <Skeleton className="h-12 w-64 rounded-xl" />
                <Skeleton className="h-12 w-48 rounded-xl" />
            </div>
            <div className="grid grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-3xl" />)}
            </div>
            <div className="grid grid-cols-3 gap-8">
                <Skeleton className="col-span-2 h-[500px] rounded-3xl" />
                <Skeleton className="h-[500px] rounded-3xl" />
            </div>
        </div>
    )
}