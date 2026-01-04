"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Calendar } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format, isSameDay } from "date-fns"
import { BalanceCard, AttendanceWidget, StatusBadge, HolidayItem, WelcomeBanner } from "@/components/dashboard/DashboardWidgets"

export default function EmployeeDashboardView({ user, stats, leaves }: any) {
    const holidays = stats?.upcomingHolidays || [];
    const holidaysLoading = !stats;

    // Find today's attendance record
    const todayStatus = stats?.recentAttendance?.find((att: any) =>
        isSameDay(new Date(att.date), new Date())
    );

    const welcomeMessage = stats?.pendingRequests > 0
        ? <span>You have <span className="text-white font-semibold">{stats.pendingRequests} pending requests</span> requiring your attention.</span>
        : "You are all caught up! No pending requests at the moment.";

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto">
            <WelcomeBanner name={user?.name || 'Employee'} role="Employee" showButton={false} message={welcomeMessage} />

            {/* Balance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <div className="relative group overflow-hidden rounded-xl">
                    <div className="blur-[2px] pointer-events-none">
                        <BalanceCard label="Annual Leave" current={stats?.leaveBalance?.used || 0} total={stats?.leaveBalance?.total || 20} color="bg-indigo-600" />
                    </div>
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/5">
                        <span className="bg-slate-900 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Coming Soon</span>
                    </div>
                </div>
                <BalanceCard label="Pending Requests" current={stats?.pendingRequests || 0} total={5} color="bg-amber-500" />
                {/* Attendance Widget */}
                <div className="md:col-span-1 lg:col-span-2">
                    <div className="relative h-full group overflow-hidden rounded-xl">
                        <div className="h-full blur-[2px] pointer-events-none">
                            <AttendanceWidget todayStatus={todayStatus} />
                        </div>
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/5">
                            <span className="bg-slate-900 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Coming Soon</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-slate-800">My Leave History</h3>
                    </div>
                    <Card className="border-slate-200/60 shadow-sm overflow-hidden ring-1 ring-slate-900/5">
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
                                            <p className="text-[10px] text-slate-500 mt-1">Requested on {format(new Date(leave.createdAt), "MMM d, yyyy")}</p>
                                        </TableCell>
                                        <TableCell className="py-3 px-5">
                                            <p className="text-sm font-medium text-slate-600 leading-none">
                                                {format(new Date(leave.startDate), "MMM d")} - {format(new Date(leave.endDate), "MMM d, yyyy")}
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
                    <Card className="border-slate-200/60 shadow-sm ring-1 ring-slate-900/5 relative overflow-hidden">
                        <CardHeader className="border-b border-slate-50">
                            <CardTitle className="text-sm font-bold text-slate-800">Upcoming Holidays</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6 blur-[2px] pointer-events-none select-none">
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
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/5">
                            <span className="bg-slate-900 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Coming Soon</span>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}
