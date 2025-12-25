"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
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
    Plus,
    XCircle,
} from "lucide-react"
import { useLeaves, useCreateLeave } from "@/lib/hooks/useLeaves"
import { Leave } from "@/lib/services/leaves"

export default function LeavesView() {
    const { user } = useAuth()
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)

    // Request Form
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [reason, setReason] = useState("")
    const [leaveType, setLeaveType] = useState("Vacation") // Default type

    // Use hooks
    // Pass user.id to get only this user's leaves
    const { data: leaves = [], isLoading } = useLeaves(user?.id)
    const createLeaveMutation = useCreateLeave()

    const handleRequestLeave = (e: React.FormEvent) => {
        e.preventDefault()

        createLeaveMutation.mutate({
            type: leaveType,
            startDate,
            endDate,
            reason
        }, {
            onSuccess: () => {
                setIsRequestModalOpen(false)
                setStartDate("")
                setEndDate("")
                setReason("")
            }
        })
    }

    return (
        <div className="space-y-8 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Leave History</h1>
                    <p className="text-slate-500 text-sm max-w-2xl leading-relaxed italic">
                        Track your time off history and status.
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
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-slate-100">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Skeleton className="h-8 w-8 rounded-lg" />
                                                <div className="space-y-1">
                                                    <Skeleton className="h-4 w-24" />
                                                    <Skeleton className="h-3 w-32" />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4"><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell className="px-6 py-4"><Skeleton className="h-4 w-16" /></TableCell>
                                        <TableCell className="px-6 py-4"><Skeleton className="h-4 w-40" /></TableCell>
                                        <TableCell className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                    </TableRow>
                                ))
                            ) : leaves.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="p-12 text-center text-slate-400">No leave requests found.</TableCell>
                                </TableRow>
                            ) : (
                                leaves.map((leave: Leave) => (
                                    <TableRow key={leave.id} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8 rounded-lg border border-slate-200">
                                                    <AvatarFallback className="bg-slate-100 text-slate-600 font-bold text-[10px]">
                                                        {leave.user?.name?.charAt(0) || 'U'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm">{leave.user?.name || 'Unknown'}</p>
                                                    <p className="text-xs text-slate-500">{leave.user?.email}</p>
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
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Card>
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
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Type</Label>
                                    <select
                                        className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                                        value={leaveType}
                                        onChange={(e) => setLeaveType(e.target.value)}
                                    >
                                        <option value="Vacation">Vacation</option>
                                        <option value="Sick">Sick Leave</option>
                                        <option value="Personal">Personal</option>
                                    </select>
                                </div>
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
                                        disabled={createLeaveMutation.isPending}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 font-semibold"
                                    >
                                        {createLeaveMutation.isPending ? (
                                            <>
                                                <Spinner className="mr-2 h-4 w-4 animate-spin" />
                                                Submitting...
                                            </>
                                        ) : 'Submit Request'}
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
