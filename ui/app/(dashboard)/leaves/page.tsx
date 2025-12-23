"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
    Calendar,
    CheckCircle2,
    XCircle,
    Clock,
    Plus,
    Filter,
    MoreHorizontal
} from "lucide-react"

interface Leave {
    id: number
    startDate: string
    endDate: string
    totalDays: number
    reason: string
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
    user: {
        name: string
        email: string
    }
}

export default function LeavesPage() {
    const { user } = useAuth()
    const [leaves, setLeaves] = useState<Leave[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'MY_LEAVES' | 'TEAM_LEAVES'>(user?.role === 'EMPLOYEE' ? 'MY_LEAVES' : 'TEAM_LEAVES')
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)

    // Request Form
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [reason, setReason] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const fetchLeaves = async () => {
        setIsLoading(true)
        try {
            const token = localStorage.getItem("token")
            let url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/leaves`

            if (activeTab === 'MY_LEAVES') {
                url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/leaves/user/${user.id}`
            }

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await response.json()
            if (response.ok) {
                setLeaves(data.data.leaves)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (user) {
            fetchLeaves()
        }
    }, [user, activeTab])

    const handleRequestLeave = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            const token = localStorage.getItem("token")
            const start = new Date(startDate)
            const end = new Date(endDate)
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/leaves`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId: user.id,
                    startDate,
                    endDate,
                    totalDays: diffDays,
                    reason
                })
            })

            if (response.ok) {
                setIsRequestModalOpen(false)
                setStartDate("")
                setEndDate("")
                setReason("")
                fetchLeaves()
                if (activeTab !== 'MY_LEAVES') setActiveTab('MY_LEAVES')
            }
        } catch (err) {
            console.error(err)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleStatusUpdate = async (id: number, status: string) => {
        try {
            const token = localStorage.getItem("token")
            await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/leaves/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            })
            fetchLeaves()
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <div className="-m-4 lg:-m-8 bg-[#f8fafc] min-h-[calc(100vh-4rem)] pb-20">
            <div className="max-w-[1400px] mx-auto px-6 pt-8 space-y-8">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Leave Management</h1>
                        <p className="text-slate-500 text-sm max-w-2xl leading-relaxed italic">
                            Track time off, manage requests, and approvals.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={() => setIsRequestModalOpen(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 border-none"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            New Request
                        </Button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-6 border-b border-slate-200">
                    {(user?.role === 'ADMIN' || user?.role === 'HR') && (
                        <button
                            onClick={() => setActiveTab('TEAM_LEAVES')}
                            className={`pb-3 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'TEAM_LEAVES'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            Team Requests
                        </button>
                    )}
                    <button
                        onClick={() => setActiveTab('MY_LEAVES')}
                        className={`pb-3 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'MY_LEAVES'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        My History
                    </button>
                </div>

                {/* Leaves List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            Request Log
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                                {leaves.length} Total
                            </span>
                        </h2>
                    </div>
                    <Card className="border-none shadow-sm overflow-hidden bg-white">
                        <Table>
                            <TableHeader className="bg-slate-50 border-b border-slate-100">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Employee</TableHead>
                                    <TableHead className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Period</TableHead>
                                    <TableHead className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Duration</TableHead>
                                    <TableHead className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Reason</TableHead>
                                    <TableHead className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-[120px]">Status</TableHead>
                                    {activeTab === 'TEAM_LEAVES' && <TableHead className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-slate-100">
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="p-8 text-center text-slate-500">Loading requests...</TableCell>
                                    </TableRow>
                                ) : leaves.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="p-12 text-center text-slate-400">No leave requests found.</TableCell>
                                    </TableRow>
                                ) : (
                                    leaves.map((leave) => (
                                        <TableRow key={leave.id} className="hover:bg-slate-50/50 transition-colors">
                                            <TableCell className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8 rounded-lg border border-slate-200">
                                                        <AvatarFallback className="bg-slate-100 text-slate-600 font-bold text-[10px]">
                                                            {leave.user.name.charAt(0)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-sm">{leave.user.name}</p>
                                                        <p className="text-xs text-slate-500">{leave.user.email}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-slate-600 font-medium whitespace-nowrap">
                                                {new Date(leave.startDate).toLocaleDateString()} <span className="text-slate-300 mx-1">—</span> {new Date(leave.endDate).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-slate-900 font-bold">
                                                {leave.totalDays} days
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-slate-500 text-xs max-w-xs truncate font-medium">
                                                {leave.reason}
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <Badge className={`
                                                font-bold border-0 px-2.5 py-0.5 text-[10px] uppercase tracking-tight rounded-full
                                                ${leave.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                        leave.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                                            'bg-amber-50 text-amber-700 border-amber-100'}
                                            `}>
                                                    {leave.status}
                                                </Badge>
                                            </TableCell>
                                            {activeTab === 'TEAM_LEAVES' && (
                                                <TableCell className="px-6 py-4 text-right">
                                                    {leave.status === 'PENDING' ? (
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                onClick={() => handleStatusUpdate(leave.id, 'APPROVED')}
                                                                size="sm"
                                                                className="h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold"
                                                            >
                                                                Approve
                                                            </Button>
                                                            <Button
                                                                onClick={() => handleStatusUpdate(leave.id, 'REJECTED')}
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-7 px-3 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 rounded-md text-xs font-bold"
                                                            >
                                                                Reject
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 font-medium italic">Completed</span>
                                                    )}
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </div>
            </div>

            {/* Request Modal */}
            {isRequestModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <Card className="w-full max-w-md bg-white border-0 shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 duration-200">
                        <CardHeader className="border-b border-slate-100 pb-4">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg font-bold text-slate-900">Request Time Off</CardTitle>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-400 hover:text-slate-900 rounded-full"
                                    onClick={() => setIsRequestModalOpen(false)}
                                >
                                    <XCircle className="w-5 h-5" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <form onSubmit={handleRequestLeave} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">From</Label>
                                        <Input
                                            type="date"
                                            value={startDate}
                                            onChange={e => setStartDate(e.target.value)}
                                            className="rounded-lg border-slate-200 focus:ring-slate-900"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">To</Label>
                                        <Input
                                            type="date"
                                            value={endDate}
                                            onChange={e => setEndDate(e.target.value)}
                                            className="rounded-lg border-slate-200 focus:ring-slate-900"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Reason</Label>
                                    <Input
                                        value={reason}
                                        onChange={e => setReason(e.target.value)}
                                        placeholder="E.g. Summer Vacation"
                                        className="rounded-lg border-slate-200 focus:ring-slate-900"
                                    />
                                </div>
                                <div className="pt-4 flex justify-end gap-3">
                                    <Button
                                        type="button"
                                        onClick={() => setIsRequestModalOpen(false)}
                                        variant="outline"
                                        className="rounded-xl border-slate-200 font-semibold"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 font-semibold"
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Submit Request'}
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
