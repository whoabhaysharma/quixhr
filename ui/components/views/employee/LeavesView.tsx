"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DatePicker } from "@/components/ui/date-picker"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/context/auth-context"
import {
    Calendar,
    X,
    CalendarDays,
    Search,
    Filter,
    ChevronDown,
    Check,
    Plus,
    Trash2
} from "lucide-react"
import { cn } from "@/lib/utils"
// Import useDeleteLeave
import { useLeaves, useCreateLeave, useDeleteLeave } from "@/lib/hooks/useLeaves"
import { Leave } from "@/lib/services/leaves"
import { toast } from "sonner"

// Helper to map backend enum to display names
// Helper to map backend enum to display names
const getLeaveTypeDisplay = (type: string): string => {
    const typeMap: Record<string, string> = {
        'ANNUAL': 'Annual Leave',
        'SICK': 'Sick Leave',
        'CASUAL': 'Casual Leave',
        'MATERNITY': 'Maternity Leave',
        'PATERNITY': 'Paternity Leave',
        'UNPAID': 'Unpaid Leave',
        'OTHER': 'Other'
    };
    return typeMap[type] || type;
};

export default function LeavesView() {
    const { user } = useAuth()
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)

    // Form State
    const [mode, setMode] = useState<"single" | "range">("single")
    const [leaveType, setLeaveType] = useState("ANNUAL")
    const [reason, setReason] = useState("")

    // Filter State
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")

    // Date State
    const [singleDate, setSingleDate] = useState<Date>()
    const [startDate, setStartDate] = useState<Date>()
    const [endDate, setEndDate] = useState<Date>()

    const { data: leaves = [], isLoading } = useLeaves()
    const createLeaveMutation = useCreateLeave()
    const deleteLeaveMutation = useDeleteLeave()

    const [deleteId, setDeleteId] = useState<string | null>(null)

    const handleDelete = (id: string) => {
        setDeleteId(id)
    }

    const confirmDelete = () => {
        if (deleteId) {
            deleteLeaveMutation.mutate(deleteId, {
                onSuccess: () => setDeleteId(null)
            })
        }
    }


    const handleRequestLeave = (e: React.FormEvent) => {
        e.preventDefault()

        let finalStartDate: Date | undefined
        let finalEndDate: Date | undefined
        let finalReason = reason

        if (mode === "single") {
            finalStartDate = singleDate
            finalEndDate = singleDate
        } else if (mode === "range") {
            finalStartDate = startDate
            finalEndDate = endDate
        }

        if (!finalStartDate || !finalEndDate) {
            toast.error("Please select a valid date range")
            return
        }

        const payload: any = {
            type: leaveType, // Now directly using backend enum
            startDate: finalStartDate.toISOString(),
            endDate: finalEndDate.toISOString(),
            reason: finalReason
        };



        createLeaveMutation.mutate(payload, {
            onSuccess: () => {
                setIsRequestModalOpen(false)
                resetForm()
            }
        })
    }

    const resetForm = () => {
        setSingleDate(undefined)
        setStartDate(undefined)
        setEndDate(undefined)
        setReason("")
        setLeaveType("ANNUAL")
        setMode("single")
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Time Off</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Manage your leave requests and track your approval status.
                    </p>
                </div>
                <div>
                    <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Request Leave
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="w-[95vw] sm:w-full sm:max-w-[550px] max-h-[85vh] flex flex-col p-0 gap-0">
                            <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0 text-left">
                                <DialogTitle className="text-xl flex items-center gap-2">
                                    <CalendarDays className="w-5 h-5 text-primary" />
                                    New Leave Request
                                </DialogTitle>
                                <DialogDescription>
                                    Fill in the details below to submit your time off request.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="flex-1 overflow-y-auto min-h-0">
                                <form id="leave-request-form" onSubmit={handleRequestLeave} className="px-6 py-6 space-y-6">
                                    {/* Leave Type */}
                                    <div className="space-y-3">
                                        <Label>Leave Type</Label>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {[
                                                { id: 'ANNUAL', label: 'Annual' },
                                                { id: 'SICK', label: 'Sick' },
                                                { id: 'CASUAL', label: 'Casual' },
                                                { id: 'MATERNITY', label: 'Maternity' },
                                                { id: 'PATERNITY', label: 'Paternity' },
                                                { id: 'UNPAID', label: 'Unpaid' },
                                                { id: 'OTHER', label: 'Other' }
                                            ].map((type) => (
                                                <div
                                                    key={type.id}
                                                    onClick={() => setLeaveType(type.id)}
                                                    className={cn(
                                                        "cursor-pointer rounded-md border px-3 py-3 text-center transition-all flex items-center justify-center min-h-[48px] text-sm font-medium",
                                                        leaveType === type.id
                                                            ? "border-primary bg-primary/10 text-primary"
                                                            : "border-input bg-background hover:bg-accent hover:text-accent-foreground"
                                                    )}
                                                >
                                                    {type.label}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Duration Mode */}
                                    <div className="space-y-3">
                                        <Label>Duration</Label>
                                        <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-full">
                                            <TabsList className="grid w-full grid-cols-2">
                                                <TabsTrigger value="single">Single Day</TabsTrigger>
                                                <TabsTrigger value="range">Range</TabsTrigger>
                                            </TabsList>

                                            <div className="mt-4">
                                                <TabsContent value="single" className="mt-0 space-y-3">
                                                    <Label>Date</Label>
                                                    <DatePicker
                                                        date={singleDate}
                                                        setDate={setSingleDate}
                                                        className="w-full bg-white border-slate-200 h-11"
                                                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                                    />
                                                </TabsContent>

                                                <TabsContent value="range" className="mt-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Start Date</Label>
                                                        <DatePicker
                                                            date={startDate}
                                                            setDate={setStartDate}
                                                            className="w-full bg-white border-slate-200 h-11"
                                                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>End Date</Label>
                                                        <DatePicker
                                                            date={endDate}
                                                            setDate={setEndDate}
                                                            className="w-full bg-white border-slate-200 h-11"
                                                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0)) || (startDate ? date < startDate : false)}
                                                        />
                                                    </div>
                                                </TabsContent>


                                            </div>
                                        </Tabs>
                                    </div>

                                    {/* Reason */}
                                    <div className="space-y-3">
                                        <Label>Reason</Label>
                                        <Textarea
                                            maxLength={500}
                                            value={reason}
                                            onChange={e => setReason(e.target.value)}
                                            placeholder="e.g. Taking a break to recharge..."
                                            className="field-sizing-fixed resize-none min-h-[100px] max-h-[200px] overflow-y-auto"
                                        />
                                        <div className="text-xs text-right text-muted-foreground">
                                            {reason.length}/500
                                        </div>
                                    </div>

                                </form>
                            </div>

                            <DialogFooter className="p-6 border-t bg-muted/20 gap-2 sm:gap-0">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsRequestModalOpen(false)}
                                    className="h-10"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    form="leave-request-form"
                                    disabled={createLeaveMutation.isPending}
                                    className="h-10 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {createLeaveMutation.isPending ? (
                                        <>
                                            <Spinner className="mr-2 h-4 w-4 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : 'Submit Request'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Leaves List */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                        Request History ({leaves.length})
                    </h2>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-[140px] h-9 bg-white justify-between">
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
                            <DropdownMenuContent align="end" className="w-[140px]">
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
                                placeholder="Search reason..."
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
                                <TableHead className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Type</TableHead>
                                <TableHead className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Period</TableHead>
                                <TableHead className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Duration</TableHead>
                                <TableHead className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Reason</TableHead>
                                <TableHead className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[120px]">Status</TableHead>
                                <TableHead className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[60px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-slate-100">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i} className="border-slate-100">
                                        <TableCell className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Skeleton className="h-9 w-9 rounded-lg" />
                                                <div className="space-y-1">
                                                    <Skeleton className="h-4 w-24" />
                                                    <Skeleton className="h-3 w-16" />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4"><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell className="px-6 py-4"><Skeleton className="h-4 w-16" /></TableCell>
                                        <TableCell className="px-6 py-4"><Skeleton className="h-4 w-40" /></TableCell>
                                        <TableCell className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-lg" /></TableCell>
                                    </TableRow>
                                ))
                            ) : leaves.filter((leave: Leave) => {
                                // Status Filter
                                if (statusFilter !== "all" && leave.status !== statusFilter) return false;

                                // Search Filter (Reason)
                                if (searchQuery) {
                                    const searchLower = searchQuery.toLowerCase();
                                    return leave.reason?.toLowerCase().includes(searchLower) ||
                                        getLeaveTypeDisplay(leave.type).toLowerCase().includes(searchLower);
                                }

                                return true;
                            }).length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="p-12 text-center text-slate-500">
                                        <p className="text-sm font-medium">No leave requests found</p>
                                        {(searchQuery || statusFilter !== "all") ? (
                                            <p className="text-xs text-slate-400 mt-1">Try adjusting your filters</p>
                                        ) : (
                                            <p className="text-xs text-slate-400 mt-1">Create a new request to get started.</p>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                leaves
                                    .filter((leave: Leave) => {
                                        // Status Filter
                                        if (statusFilter !== "all" && leave.status !== statusFilter) return false;

                                        // Search Filter (Reason)
                                        if (searchQuery) {
                                            const searchLower = searchQuery.toLowerCase();
                                            return leave.reason?.toLowerCase().includes(searchLower) ||
                                                getLeaveTypeDisplay(leave.type).toLowerCase().includes(searchLower);
                                        }

                                        return true;
                                    })
                                    .map((leave: Leave) => {
                                        const isAdmin = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR_ADMIN'].includes(user?.user?.role || '');
                                        const canDelete = isAdmin || leave.status === 'PENDING';

                                        // Check if start and end date are the same calendar day
                                        const isSingleDay = leave.startDate.split('T')[0] === leave.endDate.split('T')[0];

                                        // Helper to format date strings without timezone shifts
                                        // We basically take the YYYY-MM-DD part from the ISO string and treat it as the intended date
                                        const formatSafeDate = (isoString: string, includeYear: boolean = true) => {
                                            if (!isoString) return '';
                                            try {
                                                const [y, m, d] = isoString.split('T')[0].split('-').map(Number);
                                                const date = new Date(y, m - 1, d); // Construct date in local time using the components
                                                return format(date, includeYear ? 'MMM dd, yyyy' : 'MMM dd');
                                            } catch (e) {
                                                return isoString;
                                            }
                                        };

                                        return (
                                            <TableRow key={leave.id} className="hover:bg-slate-50 transition-colors border-slate-100 group">
                                                <TableCell className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm",
                                                            leave.type === 'ANNUAL' ? "bg-blue-100 text-blue-600" :
                                                                leave.type === 'SICK' ? "bg-rose-100 text-rose-600" :
                                                                    "bg-purple-100 text-purple-600"
                                                        )}>
                                                            {getLeaveTypeDisplay(leave.type).charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-slate-900 text-sm leading-tight">{getLeaveTypeDisplay(leave.type)}</p>

                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-6 py-4">
                                                    <div className="flex flex-col gap-0.5">
                                                        {isSingleDay ? (
                                                            <span className="text-sm font-semibold text-slate-900">
                                                                {formatSafeDate(leave.startDate)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-sm font-semibold text-slate-900">
                                                                {formatSafeDate(leave.startDate, false)}
                                                                <span className="text-slate-400 mx-1.5">→</span>
                                                                {formatSafeDate(leave.endDate)}
                                                            </span>
                                                        )}
                                                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                                                            {isSingleDay ? 'Single Day' : 'Date Range'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-6 py-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-sm font-bold text-slate-900">{leave.daysTaken}</span>
                                                        <span className="text-xs text-slate-500 font-medium">{leave.daysTaken === 1 ? 'day' : 'days'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-6 py-4 max-w-[200px]">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <p className="text-sm text-muted-foreground truncate font-medium cursor-help">
                                                                    {leave.reason || "No reason provided"}
                                                                </p>
                                                            </TooltipTrigger>
                                                            <TooltipContent className="max-w-[300px] break-words">
                                                                <p>{leave.reason || "No reason provided"}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </TableCell>
                                                <TableCell className="px-6 py-4">
                                                    <Badge className={cn(
                                                        "font-bold border-0 px-2.5 py-1 text-[10px] uppercase tracking-tight rounded-lg shadow-none",
                                                        leave.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' :
                                                            leave.status === 'REJECTED' ? 'bg-rose-100 text-rose-700 hover:bg-rose-100' :
                                                                'bg-amber-100 text-amber-700 hover:bg-amber-100'
                                                    )}>
                                                        {leave.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="px-6 py-4">
                                                    {canDelete && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                                                            onClick={() => handleDelete(leave.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
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

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your leave request.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700 text-white border-0"
                        >
                            {deleteLeaveMutation.isPending ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
