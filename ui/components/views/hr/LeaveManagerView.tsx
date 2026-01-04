"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useLeaves, useOrgLeaves, useUpdateLeaveStatus } from "@/lib/hooks/useLeaves"
import { Leave } from "@/lib/services/leaves"
import { useAuth } from "@/context/auth-context"

export default function LeaveManagerView() {
    const { user } = useAuth()
    const [searchQuery, setSearchQuery] = useState("")

    // Use the custom hook for fetching org leaves
    // We assume the user has an organization
    const organizationId = user?.organization?.id || ''

    // Only fetch if we have an org ID
    const { data: leaves = [], isLoading } = useOrgLeaves(organizationId)

    // Use the custom hook for updating leave status
    const updateLeaveStatusMutation = useUpdateLeaveStatus()

    const handleStatusUpdate = (id: string, status: 'APPROVED' | 'REJECTED') => {
        updateLeaveStatusMutation.mutate({
            requestId: id,
            status
        })
    }

    const filteredLeaves = leaves.filter((leave: Leave) => {
        const userName = leave.user?.name || ''
        const userEmail = leave.user?.email || ''
        const reason = leave.reason || ''

        return userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
            reason.toLowerCase().includes(searchQuery.toLowerCase())
    })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Leave Management</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Review and manage employee leave requests.
                    </p>
                </div>
            </div>

            {/* Leaves List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                        Requests & History ({filteredLeaves.length})
                    </h2>
                    <div className="relative w-full max-w-xs hidden sm:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search requests..."
                            className="pl-9 h-9 bg-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50 border-b border-slate-100">
                            <TableRow className="hover:bg-transparent border-slate-100">
                                <TableHead className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Employee</TableHead>
                                <TableHead className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Period</TableHead>
                                <TableHead className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Duration</TableHead>
                                <TableHead className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Reason</TableHead>
                                <TableHead className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[120px]">Status</TableHead>
                                <TableHead className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-slate-100">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i} className="border-slate-100">
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
                                        <TableCell className="px-6 py-4 text-right"><Skeleton className="h-7 w-20 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredLeaves.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="p-12 text-center text-slate-500">
                                        <p className="text-sm font-medium">No leave requests found</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredLeaves.map((leave: Leave) => (
                                    <TableRow key={leave.id} className="hover:bg-slate-50 transition-colors border-slate-100">
                                        <TableCell className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8 rounded-lg border border-slate-200">
                                                    <AvatarFallback className="bg-slate-100 text-slate-600 font-bold text-[10px]">
                                                        {leave.user?.name?.charAt(0) || 'U'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-semibold text-slate-900 text-sm">{leave.user?.name || 'Unknown'}</p>
                                                    <p className="text-xs text-slate-500">{leave.user?.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-slate-600 font-medium whitespace-nowrap text-sm">
                                            {new Date(leave.startDate).toLocaleDateString()} <span className="text-slate-300 mx-1">—</span> {new Date(leave.endDate).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-slate-900 font-bold text-sm">
                                            {leave.totalDays} days
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-slate-500 text-sm max-w-xs truncate font-medium">
                                            {leave.reason}
                                        </TableCell>
                                        <TableCell className="px-6 py-4">
                                            <Badge className={`
                                            font-bold border-0 px-2.5 py-0.5 text-[10px] uppercase tracking-tight rounded-md shadow-none
                                            ${leave.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' :
                                                    leave.status === 'REJECTED' ? 'bg-rose-100 text-rose-700 hover:bg-rose-100' :
                                                        'bg-amber-100 text-amber-700 hover:bg-amber-100'}
                                        `}>
                                                {leave.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-right">
                                            {leave.status === 'PENDING' ? (
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        onClick={() => handleStatusUpdate(leave.id, 'APPROVED')}
                                                        size="sm"
                                                        disabled={updateLeaveStatusMutation.isPending && updateLeaveStatusMutation.variables?.requestId === leave.id}
                                                        className="h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold shadow-sm"
                                                    >
                                                        {updateLeaveStatusMutation.isPending && updateLeaveStatusMutation.variables?.requestId === leave.id && updateLeaveStatusMutation.variables?.status === 'APPROVED' ? (
                                                            <Spinner className="h-3 w-3 animate-spin" />
                                                        ) : 'Approve'}
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleStatusUpdate(leave.id, 'REJECTED')}
                                                        size="sm"
                                                        variant="outline"
                                                        disabled={updateLeaveStatusMutation.isPending && updateLeaveStatusMutation.variables?.requestId === leave.id}
                                                        className="h-7 px-3 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 rounded-md text-xs font-bold shadow-sm"
                                                    >
                                                        {updateLeaveStatusMutation.isPending && updateLeaveStatusMutation.variables?.requestId === leave.id && updateLeaveStatusMutation.variables?.status === 'REJECTED' ? (
                                                            <Spinner className="h-3 w-3 animate-spin" />
                                                        ) : 'Reject'}
                                                    </Button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400 font-medium italic">Completed</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}
