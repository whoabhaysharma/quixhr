"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Input } from "@/components/ui/input"
import { Search, Filter, ChevronDown, Check } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
    const [debouncedSearch, setDebouncedSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery)
        }, 500)

        return () => clearTimeout(timer)
    }, [searchQuery])

    // Use the custom hook for fetching org leaves
    // We assume the user has an organization
    const organizationId = user?.organization?.id || ''

    // Build filters object
    const filters = {
        search: debouncedSearch || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        limit: 100, // Get more results for better UX
    }

    // Only fetch if we have an org ID
    const { data: leaves = [], isLoading } = useOrgLeaves(organizationId, filters)

    // Use the custom hook for updating leave status
    const updateLeaveStatusMutation = useUpdateLeaveStatus()

    const handleStatusUpdate = (id: string, status: 'APPROVED' | 'REJECTED') => {
        updateLeaveStatusMutation.mutate({
            requestId: id,
            status
        })
    }

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
                <div className="flex items-center justify-between gap-4">
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                        Requests & History ({leaves.length})
                    </h2>
                    <div className="flex items-center gap-3">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-[160px] h-9 bg-white justify-between">
                                    <div className="flex items-center gap-2">
                                        <Filter className="w-4 h-4 text-slate-400" />
                                        <span className="text-sm">
                                            {statusFilter === "all" ? "All Status" :
                                                statusFilter === "PENDING" ? "Pending" :
                                                    statusFilter === "APPROVED" ? "Approved" : "Rejected"}
                                        </span>
                                    </div>
                                    <ChevronDown className="w-4 h-4 text-slate-400" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[160px]">
                                <DropdownMenuItem
                                    onClick={() => setStatusFilter("all")}
                                    className="cursor-pointer"
                                >
                                    <Check className={`w-4 h-4 mr-2 ${statusFilter === "all" ? "opacity-100" : "opacity-0"}`} />
                                    All Status
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setStatusFilter("PENDING")}
                                    className="cursor-pointer"
                                >
                                    <Check className={`w-4 h-4 mr-2 ${statusFilter === "PENDING" ? "opacity-100" : "opacity-0"}`} />
                                    Pending
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setStatusFilter("APPROVED")}
                                    className="cursor-pointer"
                                >
                                    <Check className={`w-4 h-4 mr-2 ${statusFilter === "APPROVED" ? "opacity-100" : "opacity-0"}`} />
                                    Approved
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setStatusFilter("REJECTED")}
                                    className="cursor-pointer"
                                >
                                    <Check className={`w-4 h-4 mr-2 ${statusFilter === "REJECTED" ? "opacity-100" : "opacity-0"}`} />
                                    Rejected
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <div className="relative w-full max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Search by name, email, or reason..."
                                className="pl-9 h-9 bg-white"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
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
                            ) : leaves.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="p-12 text-center text-slate-500">
                                        <p className="text-sm font-medium">No leave requests found</p>
                                        {(searchQuery || statusFilter !== "all") && (
                                            <p className="text-xs text-slate-400 mt-1">Try adjusting your filters</p>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                leaves.map((leave: Leave) => {
                                    const startDate = new Date(leave.startDate);
                                    const endDate = new Date(leave.endDate);
                                    const isSingleDay = startDate.toDateString() === endDate.toDateString();
                                    const totalDays = leave.totalDays || 1;

                                    return (
                                        <TableRow key={leave.id} className="hover:bg-slate-50 transition-colors border-slate-100 group">
                                            <TableCell className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9 rounded-lg border border-slate-200 group-hover:border-indigo-200 transition-colors">
                                                        <AvatarFallback className="bg-gradient-to-br from-indigo-50 to-slate-50 text-indigo-600 font-bold text-xs">
                                                            {leave.user?.name?.charAt(0) || 'U'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-semibold text-slate-900 text-sm leading-tight">{leave.user?.name || 'Unknown'}</p>
                                                        <p className="text-xs text-slate-500 mt-0.5">{leave.user?.email}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <div className="flex flex-col gap-0.5">
                                                    {isSingleDay ? (
                                                        <span className="text-sm font-semibold text-slate-900">
                                                            {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </span>
                                                    ) : (
                                                        <>
                                                            <span className="text-sm font-semibold text-slate-900">
                                                                {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                                <span className="text-slate-400 mx-1.5">→</span>
                                                                {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                            </span>
                                                        </>
                                                    )}
                                                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                                                        {isSingleDay ? 'Single Day' : 'Date Range'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-sm font-bold text-slate-900">{totalDays}</span>
                                                    <span className="text-xs text-slate-500 font-medium">{totalDays === 1 ? 'day' : 'days'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <p className="text-sm text-slate-600 max-w-xs truncate font-medium leading-relaxed">
                                                    {leave.reason || 'No reason provided'}
                                                </p>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <Badge className={`
                                                    font-bold border-0 px-2.5 py-1 text-[10px] uppercase tracking-tight rounded-lg shadow-none
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
                                                            className="h-8 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm hover:shadow-md transition-all"
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
                                                            className="h-8 px-4 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 rounded-lg text-xs font-bold shadow-sm hover:shadow-md transition-all"
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
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}
