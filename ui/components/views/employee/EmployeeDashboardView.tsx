"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Calendar } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { useUpcomingHolidays } from "@/lib/hooks/useHolidays"
import { BalanceCard, AttendanceWidget, StatusBadge, HolidayItem, WelcomeBanner } from "@/components/dashboard/DashboardWidgets"

export default function EmployeeDashboardView({ user, stats, leaves }: any) {
    const { data: holidays = [], isLoading: holidaysLoading } = useUpcomingHolidays(3)

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto">
            <WelcomeBanner name={user?.name || 'Employee'} role="Employee" />

            {/* Balance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <BalanceCard label="Annual Leave" current={stats?.used || 0} total={stats?.allowance || 20} color="bg-indigo-600" />
                <BalanceCard label="Pending Requests" current={stats?.pendingRequests || 0} total={5} color="bg-amber-500" />
                {/* Attendance Widget */}
                <div className="md:col-span-1 lg:col-span-2">
                    <AttendanceWidget />
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
                    <Card className="border-slate-200/60 shadow-sm ring-1 ring-slate-900/5">
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
