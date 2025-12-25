"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Clock, Plus, Check, ChevronDown, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DatePicker } from "@/components/ui/date-picker"
import * as attendanceService from "@/lib/services/attendance"
import { useMembers } from "@/lib/hooks/useMembers"
import { toast } from "sonner"

export default function AttendanceManagerView() {
    const queryClient = useQueryClient()
    const [isMarkDialogOpen, setIsMarkDialogOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<string>("")
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
    const [status, setStatus] = useState("PRESENT")
    const [clockInTime, setClockInTime] = useState("09:00")
    const [clockOutTime, setClockOutTime] = useState("17:00")

    const { data: attendanceRecords = [], isLoading } = useQuery({
        queryKey: ['attendance', 'all'],
        queryFn: attendanceService.getAllAttendance,
    })

    const { data: members = [] } = useMembers()

    const markMutation = useMutation({
        mutationFn: attendanceService.markAttendance,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance', 'all'] })
            toast.success("Attendance marked successfully")
            setIsMarkDialogOpen(false)
            resetForm()
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to mark attendance")
        }
    })

    const resetForm = () => {
        setSelectedUser("")
        setSelectedDate(new Date())
        setStatus("PRESENT")
        setClockInTime("09:00")
        setClockOutTime("17:00")
    }

    const handleMarkAttendance = () => {
        if (!selectedUser) {
            toast.error("Please select an employee")
            return
        }

        if (!selectedDate) {
            toast.error("Please select a date")
            return
        }

        const dateStr = format(selectedDate, "yyyy-MM-dd")

        let clockIn: Date | undefined
        let clockOut: Date | undefined

        if (status === 'PRESENT' || status === 'HALF_DAY') {
            if (clockInTime) {
                clockIn = new Date(`${dateStr}T${clockInTime}`)
            }
            if (clockOutTime) {
                clockOut = new Date(`${dateStr}T${clockOutTime}`)
            }
        }

        markMutation.mutate({
            userId: selectedUser,
            date: selectedDate,
            status: status,
            clockIn: clockIn,
            clockOut: clockOut,
        })
    }

    const calculateDuration = (start: string, end?: string) => {
        if (!end) return 'Active'
        const startDate = new Date(start)
        const endDate = new Date(end)
        const diff = endDate.getTime() - startDate.getTime()
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        return `${hours}h ${minutes}m`
    }

    const getSelectedMemberName = () => {
        const member = members.find((m: any) => m.id === selectedUser)
        return member ? member.name : "Select Employee"
    }

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Attendance Overview</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        View and monitor employee attendance records.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Dialog open={isMarkDialogOpen} onOpenChange={setIsMarkDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                                <Plus className="w-4 h-4 mr-2" />
                                Mark Attendance
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Mark Attendance</DialogTitle>
                                <DialogDescription>
                                    Manually mark attendance for an employee. This will override existing records.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-6 py-6 border-y border-slate-100 my-2">
                                {/* Employee Selection */}
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="employee" className="text-right text-slate-500 text-xs font-bold uppercase tracking-wider">
                                        Employee
                                    </Label>
                                    <div className="col-span-3">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" className="w-full justify-between font-normal text-slate-900 border-slate-200">
                                                    {getSelectedMemberName()}
                                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="w-[300px] max-h-[300px] overflow-auto">
                                                {members.map((member: any) => (
                                                    <DropdownMenuItem
                                                        key={member.id}
                                                        onSelect={() => setSelectedUser(member.id)}
                                                        className="cursor-pointer"
                                                    >
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="font-medium">{member.name}</span>
                                                            <span className="text-xs text-slate-400">{member.email}</span>
                                                        </div>
                                                        {selectedUser === member.id && <Check className="ml-auto h-4 w-4 text-indigo-600" />}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                {/* Date Selection */}
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="date" className="text-right text-slate-500 text-xs font-bold uppercase tracking-wider">
                                        Date
                                    </Label>
                                    <div className="col-span-3">
                                        <DatePicker date={selectedDate} setDate={setSelectedDate} className="w-full border-slate-200" />
                                    </div>
                                </div>

                                {/* Status Selection */}
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="status" className="text-right text-slate-500 text-xs font-bold uppercase tracking-wider">
                                        Status
                                    </Label>
                                    <div className="col-span-3">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" className="w-full justify-between font-normal text-slate-900 border-slate-200">
                                                    {status}
                                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="w-[300px]">
                                                {['PRESENT', 'ABSENT', 'HALF_DAY', 'OFF', 'LEAVE'].map((s) => (
                                                    <DropdownMenuItem
                                                        key={s}
                                                        onSelect={() => setStatus(s)}
                                                        className="cursor-pointer"
                                                    >
                                                        {s}
                                                        {status === s && <Check className="ml-auto h-4 w-4 text-indigo-600" />}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                {/* Time Selection (Conditional) */}
                                {(status === 'PRESENT' || status === 'HALF_DAY') && (
                                    <>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="clockIn" className="text-right text-slate-500 text-xs font-bold uppercase tracking-wider">
                                                Clock In
                                            </Label>
                                            <Input
                                                id="clockIn"
                                                type="time"
                                                value={clockInTime}
                                                onChange={(e) => setClockInTime(e.target.value)}
                                                className="col-span-3 border-slate-200"
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="clockOut" className="text-right text-slate-500 text-xs font-bold uppercase tracking-wider">
                                                Clock Out
                                            </Label>
                                            <Input
                                                id="clockOut"
                                                type="time"
                                                value={clockOutTime}
                                                onChange={(e) => setClockOutTime(e.target.value)}
                                                className="col-span-3 border-slate-200"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsMarkDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleMarkAttendance} disabled={markMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                    {markMutation.isPending ? "Saving..." : "Save Record"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                        Recent Activity ({attendanceRecords.length})
                    </h2>
                    <div className="relative w-full max-w-xs hidden sm:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search records..."
                            className="pl-9 h-9 bg-white"
                        />
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                    <Table>
                        <TableHeader className="bg-slate-50 border-b border-slate-100">
                            <TableRow className="hover:bg-transparent border-slate-100">
                                <TableHead className="w-[200px] pl-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Employee</TableHead>
                                <TableHead className="py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date</TableHead>
                                <TableHead className="py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</TableHead>
                                <TableHead className="py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Check In</TableHead>
                                <TableHead className="py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Check Out</TableHead>
                                <TableHead className="py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Duration</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center">
                                        <Spinner className="w-5 h-5 text-indigo-600 mx-auto mb-2" />
                                        <span className="text-xs text-slate-400">Loading attendance data...</span>
                                    </TableCell>
                                </TableRow>
                            ) : attendanceRecords.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <CalendarIcon className="w-10 h-10 text-slate-300 mb-3" />
                                            <p className="text-sm font-medium text-slate-900">No records found</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                attendanceRecords.map((record: any) => (
                                    <TableRow key={record.id} className="hover:bg-slate-50 transition-colors border-slate-100">
                                        <TableCell className="pl-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8 rounded-lg border border-slate-200">
                                                    <AvatarFallback className="bg-slate-100 text-slate-600 font-bold text-xs">
                                                        {record.user?.name?.charAt(0) || 'U'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-semibold text-slate-900 text-sm">{record.user?.name || 'Unknown'}</p>
                                                    <p className="text-[10px] text-slate-500">{record.user?.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 text-sm text-slate-600 font-medium">
                                            {format(new Date(record.date), "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <Badge
                                                className={`
                                                    font-bold uppercase tracking-tight text-[10px] px-2.5 py-0.5 border-0 shadow-none rounded-md
                                                    ${record.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' :
                                                        record.status === 'ABSENT' ? 'bg-rose-100 text-rose-700 hover:bg-rose-100' :
                                                            record.status === 'HALF_DAY' ? 'bg-amber-100 text-amber-700 hover:bg-amber-100' :
                                                                'bg-slate-100 text-slate-700 hover:bg-slate-100'}
                                                `}
                                            >
                                                {record.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-4 text-sm text-slate-600 font-mono">
                                            {record.clockIn ? format(new Date(record.clockIn), "HH:mm") : <span className="text-slate-300">--:--</span>}
                                        </TableCell>
                                        <TableCell className="py-4 text-sm text-slate-600 font-mono">
                                            {record.clockOut ? format(new Date(record.clockOut), "HH:mm") : <span className="text-slate-300">--:--</span>}
                                        </TableCell>
                                        <TableCell className="py-4 text-sm font-medium text-slate-700">
                                            {record.clockIn ? calculateDuration(record.clockIn, record.clockOut) : <span className="text-slate-300">--</span>}
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
