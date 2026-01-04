"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, CalendarDays, Clock, CheckCircle, ChevronRight, LayoutDashboard } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { format } from "date-fns"
import {
    StatCard,
    StatusBadge,
    RecentJoinersCard,
    HolidayItem,

    WelcomeBanner,
    QuickActionsCard,
    LeaveDistributionWidget,
    PendingActionsWidget
} from "@/components/dashboard/DashboardWidgets"

export default function AdminDashboardView({ user, stats, leaves }: any) {
    const presentCount = stats?.presentToday || 0
    const absentCount = stats?.absentToday || 0
    const onLeaveCount = stats?.onLeaveToday || 0
    const totalEmployees = stats?.totalEmployees || 0

    // Prevent hydration mismatch or divide by zero if data isn't loaded
    const attendanceRate = totalEmployees > 0 ? Math.round((presentCount / totalEmployees) * 100) : 0

    const welcomeMessage = stats?.pendingLeaves > 0
        ? <span>You have <span className="text-white font-semibold">{stats.pendingLeaves} pending requests</span> requiring your attention.</span>
        : "All caught up! No pending leaves to review.";

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto">
            {/* Hero Section */}
            <WelcomeBanner name={user?.name || 'Administrator'} role="Admin" message={welcomeMessage} />

            {/* KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Total Employees"
                    value={totalEmployees}
                    icon={Users}
                    trend="Active workforce"
                />
                <StatCard
                    label="Attendance Rate"
                    value={`${attendanceRate}%`}
                    icon={CheckCircle}
                    color="text-emerald-600"
                    trend="Today's Presence"
                />
                <StatCard
                    label="Pending Requests"
                    value={stats?.pendingLeaves || 0}
                    icon={Clock}
                    color="text-amber-600"
                    alert={stats?.pendingLeaves > 0}
                    trend="Requires Action"
                />
                {/* Quick Actions Card takes up one slot for balance or use StatCard if preferred */}
                <StatCard
                    label="On Leave Today"
                    value={onLeaveCount}
                    icon={CalendarDays}
                    trend="Approved Leaves"
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Main Column: Pending Action + Leave Stats */}
                <div className="xl:col-span-2 space-y-8">
                    {/* Action Center - Now utilizing the new Widget */}
                    <PendingActionsWidget leaves={leaves} />

                    {/* Secondary Metrics Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <RecentJoinersCard users={stats?.recentJoiners || []} />
                        <LeaveDistributionWidget data={stats?.leaveDistribution || []} />
                    </div>
                </div>

                {/* Right Column: Summaries & Quick Links */}
                <div className="space-y-8">
                    {/* Quick Actions */}
                    <QuickActionsCard />



                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-slate-800">Upcoming Holidays</h3>
                        </div>

                        <Card className="border-slate-200/60 shadow-sm ring-1 ring-slate-900/5">
                            <CardContent className="p-0">
                                <div className="p-4 space-y-4">
                                    {stats?.upcomingHolidays && stats.upcomingHolidays.length > 0 ? (
                                        stats.upcomingHolidays.map((holiday: any) => (
                                            <div key={holiday.id} className="pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                                                <HolidayItem
                                                    date={holiday.date}
                                                    name={holiday.name}
                                                    subtitle={holiday.description}
                                                />
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-6 text-slate-400 text-sm">
                                            No upcoming holidays
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
