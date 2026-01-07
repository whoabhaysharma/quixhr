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
} from "@/components/ui/dialog"
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
    Plus
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLeaves, useCreateLeave } from "@/lib/hooks/useLeaves"
import { Leave } from "@/lib/services/leaves"

// Helper to map backend enum to display names
const getLeaveTypeDisplay = (type: string): string => {
    const typeMap: Record<string, string> = {
        'ANNUAL': 'Vacation',
        'SICK': 'Sick',
        'CASUAL': 'Personal',
        'MATERNITY': 'Maternity',
        'PATERNITY': 'Paternity',
        'UNPAID': 'Unpaid'
    };
    return typeMap[type] || type;
};

export default function LeavesView() {
    const { user } = useAuth()
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)

    // Form State
    const [mode, setMode] = useState<"single" | "range" | "custom">("single")
    const [leaveType, setLeaveType] = useState("Vacation")
    const [reason, setReason] = useState("")

    // Filter State
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")

    // Date State
    const [singleDate, setSingleDate] = useState<Date>()
    const [startDate, setStartDate] = useState<Date>()
    const [endDate, setEndDate] = useState<Date>()
    const [customDates, setCustomDates] = useState<Date[]>([])
    const [tempCustomDate, setTempCustomDate] = useState<Date>()

    const { data: leaves = [], isLoading } = useLeaves()
    const createLeaveMutation = useCreateLeave()

    const addCustomDate = () => {
        if (!tempCustomDate) return
        const exists = customDates.some(d => d.getTime() === tempCustomDate.getTime())
        if (!exists) {
            setCustomDates([...customDates, tempCustomDate].sort((a, b) => a.getTime() - b.getTime()))
        }
        setTempCustomDate(undefined)
    }

    const removeCustomDate = (dateToRemove: Date) => {
        setCustomDates(customDates.filter(d => d.getTime() !== dateToRemove.getTime()))
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
        } else if (mode === "custom") {
            if (customDates.length === 0) return
            finalStartDate = customDates[0]
            finalEndDate = customDates[customDates.length - 1]
            const formattedDates = customDates.map(d => format(d, "MMM dd")).join(", ")
            finalReason = `${reason} (Selected Dates: ${formattedDates})`
        }

        if (!finalStartDate || !finalEndDate) return

        // Map display names to backend enums
        const typeMapping: Record<string, string> = {
            'Vacation': 'ANNUAL',
            'Sick': 'SICK',
            'Personal': 'CASUAL'
        };

        const payload: any = {
            type: typeMapping[leaveType] || 'ANNUAL', // Default to ANNUAL if not found
            startDate: finalStartDate.toISOString(),
            endDate: finalEndDate.toISOString(),
            reason: finalReason
        };

        // Include customDates array for accurate day count
        if (mode === "custom" && customDates.length > 0) {
            payload.dayDetails = customDates.map(d => d.toISOString());
        }

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
        setCustomDates([])
        setReason("")
        setLeaveType("Vacation")
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
                        <DialogContent className="sm:max-w-[550px] bg-white text-slate-900 p-0 overflow-hidden border-0 shadow-2xl rounded-2xl">
                            <DialogHeader className="px-6 pt-6 pb-4 bg-slate-50 border-b border-slate-100">
                                <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <CalendarDays className="w-5 h-5 text-indigo-600" />
                                    New Leave Request
                                </DialogTitle>
                                <DialogDescription className="text-slate-500">
                                    Fill in the details below to submit your time off request.
                                </DialogDescription>
                            </DialogHeader>

                            <form onSubmit={handleRequestLeave} className="px-6 py-6 space-y-6">
                                {/* Leave Type */}
                                <div className="space-y-3">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Leave Type</Label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {["Vacation", "Sick", "Personal"].map((type) => (
                                            <div
                                                key={type}
                                                onClick={() => setLeaveType(type)}
                                                className={cn(
                                                    "cursor-pointer rounded-xl border-2 px-4 py-3 text-center transition-all",
                                                    leaveType === type
                                                        ? "border-indigo-600 bg-indigo-50 text-indigo-700 font-bold"
                                                        : "border-slate-100 bg-white text-slate-600 hover:border-slate-200 hover:bg-slate-50"
                                                )}
                                            >
                                                <div className="text-sm">{type}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Duration Mode */}
                                <div className="space-y-3">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Duration</Label>
                                    <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-full">
                                        <TabsList className="grid w-full grid-cols-3 p-1 bg-slate-100 rounded-xl">
                                            <TabsTrigger value="single" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm">Single Day</TabsTrigger>
                                            <TabsTrigger value="range" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm">Range</TabsTrigger>
                                            <TabsTrigger value="custom" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm">Custom Dates</TabsTrigger>
                                        </TabsList>

                                        <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <TabsContent value="single" className="mt-0 space-y-3">
                                                <Label>Date</Label>
                                                <DatePicker
                                                    date={singleDate}
                                                    setDate={setSingleDate}
                                                    className="w-full bg-white border-slate-200 h-11"
                                                />
                                            </TabsContent>

                                            <TabsContent value="range" className="mt-0 grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Start Date</Label>
                                                    <DatePicker
                                                        date={startDate}
                                                        setDate={setStartDate}
                                                        className="w-full bg-white border-slate-200 h-11"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>End Date</Label>
                                                    <DatePicker
                                                        date={endDate}
                                                        setDate={setEndDate}
                                                        className="w-full bg-white border-slate-200 h-11"
                                                    />
                                                </div>
                                            </TabsContent>

                                            <TabsContent value="custom" className="mt-0 space-y-4">
                                                <div className="flex gap-2 items-end">
                                                    <div className="space-y-2 flex-1">
                                                        <Label>Pick Dates</Label>
                                                        <DatePicker
                                                            date={tempCustomDate}
                                                            setDate={setTempCustomDate}
                                                            className="w-full bg-white border-slate-200 h-11"
                                                            placeholder="Pick a date to add"
                                                        />
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        onClick={addCustomDate}
                                                        disabled={!tempCustomDate}
                                                        className="h-11 bg-slate-900 text-white hover:bg-slate-800"
                                                    >
                                                        Add
                                                    </Button>
                                                </div>

                                                {customDates.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 pt-2">
                                                        {customDates.map((date) => (
                                                            <Badge key={date.toISOString()} variant="secondary" className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 gap-2 text-sm font-medium">
                                                                {format(date, "MMM dd, yyyy")}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeCustomDate(date)}
                                                                    className="text-slate-400 hover:text-red-500 transition-colors"
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                                {customDates.length === 0 && (
                                                    <p className="text-sm text-slate-400 italic text-center py-2">No dates selected yet.</p>
                                                )}
                                            </TabsContent>
                                        </div>
                                    </Tabs>
                                </div>

                                {/* Reason */}
                                <div className="space-y-3">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Reason</Label>
                                    <Textarea
                                        value={reason}
                                        onChange={e => setReason(e.target.value)}
                                        placeholder="e.g. Taking a break to recharge..."
                                        className="resize-none min-h-[100px] bg-slate-50 border-slate-200 focus:bg-white focus:ring-indigo-500 transition-all rounded-xl"
                                    />
                                </div>

                                {/* Actions */}
                                <div className="pt-2 flex justify-end gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsRequestModalOpen(false)}
                                        className="h-11 px-6 border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={createLeaveMutation.isPending}
                                        className="h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 rounded-xl font-semibold"
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
                            ) : leaves.filter(leave => {
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
                                    .filter(leave => {
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
                                        const startDate = new Date(leave.startDate);
                                        const endDate = new Date(leave.endDate);
                                        const isSingleDay = startDate.toDateString() === endDate.toDateString();

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
                                                                {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                            </span>
                                                        ) : (
                                                            <span className="text-sm font-semibold text-slate-900">
                                                                {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                                <span className="text-slate-400 mx-1.5">→</span>
                                                                {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                            </span>
                                                        )}
                                                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                                                            {isSingleDay ? 'Single Day' : 'Date Range'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-6 py-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-sm font-bold text-slate-900">{leave.totalDays}</span>
                                                        <span className="text-xs text-slate-500 font-medium">{leave.totalDays === 1 ? 'day' : 'days'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-6 py-4">
                                                    <p className="text-sm text-slate-600 max-w-xs truncate font-medium leading-relaxed">
                                                        {leave.reason || "No reason provided"}
                                                    </p>
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
