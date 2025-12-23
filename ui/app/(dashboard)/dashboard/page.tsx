"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Calendar,
    Users,
    Clock,
    Plus,
    ArrowRight,
    PartyPopper,
    TrendingUp,
    LayoutGrid,
    MoreHorizontal
} from "lucide-react"
import { Separator } from "@/components/ui/separator"

export default function DashboardPage() {
    const { user, isLoading: authLoading } = useAuth()
    const [activeStats, setActiveStats] = useState({ pendingLeaves: 0, myPendingLeaves: 0 })
    const [recentLeaves, setRecentLeaves] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return
            setIsLoading(true)
            try {
                const token = localStorage.getItem("token")
                const headers = { 'Authorization': `Bearer ${token}` }
                const leavesRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/leaves`, { headers })
                if (leavesRes.ok) {
                    const leavesData = await leavesRes.json()
                    const allLeaves = leavesData.data.leaves
                    setActiveStats({
                        pendingLeaves: allLeaves.filter((l: any) => l.status === 'PENDING').length,
                        myPendingLeaves: allLeaves.filter((l: any) => l.userId === user.id && l.status === 'PENDING').length
                    })
                    setRecentLeaves(allLeaves.slice(0, 5))
                }
            } catch (err) {
                console.error("Dashboard error", err)
            } finally {
                setIsLoading(false)
            }
        }
        if (!authLoading) fetchData()
    }, [user, authLoading])

    if (authLoading || isLoading) {
        return <LoadingSkeleton />
    }

    const stats = [
        {
            label: "Total Personnel",
            value: "1",
            icon: Users,
            color: "text-slate-900",
            bg: "bg-slate-100",
            trend: "Current count"
        },
        {
            label: "Pending Approvals",
            value: user?.role === 'EMPLOYEE' ? activeStats.myPendingLeaves : activeStats.pendingLeaves,
            icon: Clock,
            color: "text-amber-600",
            bg: "bg-amber-50",
            trend: "Action required"
        },
        {
            label: "Active Today",
            value: "0",
            icon: Calendar,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            trend: "In office"
        },
        {
            label: "Upcoming Holiday",
            value: "Jan 01",
            icon: PartyPopper,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
            trend: "New Year's Day"
        }
    ]

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 pb-12">

            {/* --- TOP SECTION --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        {user?.name?.split(' ')[0]}'s Workspace
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-bold py-0 h-5">
                            {user?.role}
                        </Badge>
                        <span className="text-slate-400 text-sm">•</span>
                        <p className="text-slate-500 text-sm font-medium">
                            {user?.organization?.name}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" className="hidden sm:flex gap-2 font-semibold">
                        <LayoutGrid className="w-4 h-4" /> Manage Grid
                    </Button>
                    <Link href="/leaves">
                        <Button className="bg-slate-900 hover:bg-slate-800 text-white gap-2 font-semibold shadow-sm">
                            <Plus className="w-4 h-4" /> New Request
                        </Button>
                    </Link>
                </div>
            </div>

            {/* --- KPI STATS --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <Card key={i} className="border-slate-200 shadow-none hover:border-slate-300 transition-colors">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                                    <stat.icon className="w-5 h-5" />
                                </div>
                                {i === 1 && stat.value > 0 && (
                                    <span className="flex h-2 w-2 rounded-full bg-amber-500">
                                        <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-amber-400 opacity-75"></span>
                                    </span>
                                )}
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-2xl font-bold tracking-tighter text-slate-900">{stat.value}</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                            </div>
                            <Separator className="my-3 opacity-50" />
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter flex items-center gap-1.5">
                                <TrendingUp className="w-3 h-3 text-slate-300" />
                                {stat.trend}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* --- MAIN CONTENT AREA --- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* RECENT ACTIVITY TABLE STYLE */}
                <div className="lg:col-span-8 space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Application Pipeline</h2>
                        <Link href="/leaves" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                            Full Log <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>

                    <Card className="border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Requester</th>
                                        <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</th>
                                        <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {recentLeaves.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="py-12 text-center text-slate-400 text-sm italic">
                                                No active requests in current cycle.
                                            </td>
                                        </tr>
                                    ) : (
                                        recentLeaves.map((leave) => (
                                            <tr key={leave.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8 rounded-lg border border-slate-200">
                                                            <AvatarFallback className="bg-slate-100 text-slate-600 text-[10px] font-bold">
                                                                {leave.user?.name?.charAt(0)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-800 leading-none">{leave.user?.name}</p>
                                                            <p className="text-[10px] text-slate-400 mt-1 uppercase font-medium">Applied {new Date(leave.createdAt).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm text-slate-600 font-medium">{leave.type || 'Annual Leave'}</p>
                                                    <p className="text-[10px] text-slate-400">Start: {new Date(leave.startDate).toLocaleDateString()}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge className={`
                                                        px-2 py-0 h-5 border-none font-bold text-[9px] uppercase tracking-widest
                                                        ${leave.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' :
                                                            leave.status === 'PENDING' ? 'bg-amber-50 text-amber-700' :
                                                                'bg-rose-50 text-rose-700'}
                                                    `}>
                                                        {leave.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
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

                {/* SIDEBAR WIDGETS */}
                <div className="lg:col-span-4 space-y-6">

                    {/* UPCOMING WIDGET */}
                    <Card className="border-slate-200 shadow-sm bg-white">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> Calendar Events
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4 p-3 bg-slate-50/50 border border-slate-100 rounded-xl">
                                <div className="text-center bg-white border border-slate-200 rounded-lg p-2 min-w-[50px] shadow-sm">
                                    <span className="block text-[9px] text-rose-500 font-black uppercase">Jan</span>
                                    <span className="block text-xl font-black text-slate-800 leading-tight">01</span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800">New Year's Day</p>
                                    <p className="text-xs text-slate-400 font-medium italic">Full Office Closure</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-3 hover:bg-slate-50 transition-colors rounded-xl border border-transparent">
                                <div className="text-center bg-slate-100 rounded-lg p-2 min-w-[50px]">
                                    <span className="block text-[9px] text-slate-400 font-black uppercase">Jan</span>
                                    <span className="block text-xl font-black text-slate-400 leading-tight">26</span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-500">Republic Day</p>
                                    <p className="text-xs text-slate-400 font-medium italic">Gazetted Holiday</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* PREMIUM CTA */}
                    <Card className="bg-slate-900 text-white border-none shadow-xl rounded-2xl overflow-hidden relative group">
                        <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-900 opacity-90 group-hover:scale-110 transition-transform duration-700"></div>
                        <CardContent className="p-6 relative z-10">
                            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center mb-4">
                                <TrendingUp className="w-5 h-5 text-indigo-400" />
                            </div>
                            <h3 className="text-lg font-bold mb-1 tracking-tight">Enterprise Analytics</h3>
                            <p className="text-slate-400 text-xs mb-6 leading-relaxed font-medium">
                                Visualize turnover rates, payroll forecasts, and team performance trends.
                            </p>
                            <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 font-bold h-9 text-xs">
                                Upgrade Workspace
                            </Button>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    )
}

function LoadingSkeleton() {
    return (
        <div className="space-y-10 animate-pulse max-w-[1400px] mx-auto">
            <div className="flex justify-between items-end border-b border-slate-200 pb-8">
                <div className="space-y-3">
                    <Skeleton className="h-8 w-64 bg-slate-100" />
                    <Skeleton className="h-4 w-40 bg-slate-100" />
                </div>
                <Skeleton className="h-12 w-40 bg-slate-100 rounded-xl" />
            </div>
            <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="h-32 bg-slate-100 rounded-xl" />
                ))}
            </div>
            <div className="grid grid-cols-12 gap-8">
                <Skeleton className="col-span-8 h-[400px] bg-slate-100 rounded-2xl" />
                <div className="col-span-4 space-y-6">
                    <Skeleton className="h-[200px] bg-slate-100 rounded-2xl" />
                    <Skeleton className="h-[180px] bg-slate-100 rounded-2xl" />
                </div>
            </div>
        </div>
    )
}