"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
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
import { useAuth } from "@/context/auth-context"
import {
    Plus,
    Calendar,
    X,
    Clock,
    CalendarDays
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

    // Date State
    const [singleDate, setSingleDate] = useState<Date>()
    const [startDate, setStartDate] = useState<Date>()
    const [endDate, setEndDate] = useState<Date>()
    const [customDates, setCustomDates] = useState<Date[]>([])
    const [tempCustomDate, setTempCustomDate] = useState<Date>()

    const { data: leaves = [], isLoading } = useLeaves(user?.id)
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

        const payload: any = {
            type: leaveType,
            startDate: finalStartDate.toISOString(),
            endDate: finalEndDate.toISOString(),
            reason: finalReason
        };

        // Include customDates array for accurate day count
        if (mode === "custom" && customDates.length > 0) {
            payload.customDates = customDates.map(d => d.toISOString());
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
        <div className="space-y-8 max-w-[1400px] mx-auto p-4 md:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Time Off</h1>
                    <p className="text-slate-500 text-base max-w-2xl leading-relaxed">
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
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-3">
                        <Clock className="w-4 h-4 text-indigo-500" />
                        Request History
                        <Badge variant="secondary" className="ml-2 font-bold bg-slate-100 text-slate-600">
                            {leaves.length}
                        </Badge>
                    </h2>
                </div>
                <Card className="border-none shadow-sm overflow-hidden bg-white rounded-2xl ring-1 ring-slate-100">
                    <Table>
                        <TableHeader className="bg-slate-50/50 border-b border-slate-100">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Type</TableHead>
                                <TableHead className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Dates</TableHead>
                                <TableHead className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Reason</TableHead>
                                <TableHead className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-[140px] text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-slate-100">
                            {isLoading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="px-6 py-6"><Skeleton className="h-5 w-24 rounded-md" /></TableCell>
                                        <TableCell className="px-6 py-6"><Skeleton className="h-4 w-48 rounded-md" /></TableCell>
                                        <TableCell className="px-6 py-6"><Skeleton className="h-4 w-64 rounded-md" /></TableCell>
                                        <TableCell className="px-6 py-6 flex justify-end"><Skeleton className="h-7 w-20 rounded-full" /></TableCell>
                                    </TableRow>
                                ))
                            ) : leaves.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="p-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                                                <Calendar className="w-6 h-6 text-slate-400" />
                                            </div>
                                            <p className="text-slate-500 font-medium">No leave requests found</p>
                                            <p className="text-sm text-slate-400">Create a new request to get started.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                leaves.map((leave: Leave) => (
                                    <TableRow key={leave.id} className="group hover:bg-indigo-50/30 transition-colors">
                                        <TableCell className="px-6 py-5 align-top">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg",
                                                    leave.type === 'ANNUAL' ? "bg-blue-100 text-blue-600" :
                                                        leave.type === 'SICK' ? "bg-rose-100 text-rose-600" :
                                                            "bg-purple-100 text-purple-600"
                                                )}>
                                                    {getLeaveTypeDisplay(leave.type).charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{getLeaveTypeDisplay(leave.type)}</p>
                                                    <p className="text-xs text-slate-500 font-medium">
                                                        {leave.totalDays} day{leave.totalDays !== 1 && 's'}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-5 align-top">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-semibold text-slate-700">
                                                    {format(new Date(leave.startDate), "MMM d, yyyy")}
                                                    <span className="text-slate-400 mx-2">→</span>
                                                    {format(new Date(leave.endDate), "MMM d, yyyy")}
                                                </span>
                                                <span className="text-xs text-slate-500">{format(new Date(leave.startDate), "EEEE")} to {format(new Date(leave.endDate), "EEEE")}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-5 align-top">
                                            <p className="text-slate-600 text-sm leading-relaxed max-w-md">
                                                {leave.reason || "No reason provided"}
                                            </p>
                                        </TableCell>
                                        <TableCell className="px-6 py-5 align-top text-right">
                                            <Badge className={cn(
                                                "border-0 px-3 py-1 text-xs uppercase tracking-wider font-bold shadow-none",
                                                leave.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' :
                                                    leave.status === 'REJECTED' ? 'bg-rose-100 text-rose-700 hover:bg-rose-100' :
                                                        'bg-amber-100 text-amber-700 hover:bg-amber-100'
                                            )}>
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
        </div>
    )
}
