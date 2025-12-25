"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { format, differenceInHours, differenceInMinutes } from "date-fns"
import { Calendar, History, Timer, MapPin, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import * as attendanceService from "@/lib/services/attendance"
import { useAuth } from "@/context/auth-context"

export default function AttendanceView() {
    const queryClient = useQueryClient()
    const { user } = useAuth()
    const [currentTime, setCurrentTime] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    const { data: todayStatus, isLoading: isLoadingStatus } = useQuery({
        queryKey: ['attendance', 'today'],
        queryFn: attendanceService.getTodayStatus,
    })

    const { data: history = [], isLoading: isLoadingHistory } = useQuery({
        queryKey: ['attendance', 'history'],
        queryFn: attendanceService.getMyAttendance,
    })

    const clockInMutation = useMutation({
        mutationFn: attendanceService.clockIn,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance'] })
        },
    })

    const clockOutMutation = useMutation({
        mutationFn: attendanceService.clockOut,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance'] })
        },
    })

    const handleClockAction = () => {
        if (todayStatus?.clockIn && !todayStatus?.clockOut) {
            clockOutMutation.mutate()
        } else {
            clockInMutation.mutate()
        }
    }

    const isWorking = todayStatus?.clockIn && !todayStatus?.clockOut
    const isDayComplete = todayStatus?.clockIn && todayStatus?.clockOut

    const calculateDuration = (start: string, end?: string) => {
        const startDate = new Date(start)
        const endDate = end ? new Date(end) : new Date()

        const hours = differenceInHours(endDate, startDate)
        const minutes = differenceInMinutes(endDate, startDate) % 60

        return `${hours}h ${minutes}m`
    }

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Attendance</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Manage your work hours and view activity logs.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-md flex items-center gap-2 text-sm text-slate-600 font-medium shadow-sm">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {format(currentTime, "MMMM d, yyyy")}
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Action Section */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <span className="flex items-center gap-2 font-semibold text-slate-900 text-sm">
                                <Timer className="w-4 h-4 text-indigo-600" />
                                Time Tracker
                            </span>
                            {isWorking && (
                                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-0 font-mono text-xs font-bold">
                                    Active: {calculateDuration(todayStatus.clockIn)}
                                </Badge>
                            )}
                        </div>

                        <div className="p-8 flex flex-col items-center justify-center text-center space-y-8">
                            {/* Digital Clock */}
                            <div className="space-y-1">
                                <div className="text-5xl font-mono font-bold text-slate-900 tracking-tight">
                                    {format(currentTime, "HH:mm")}
                                    <span className="text-2xl text-slate-400 ml-1 font-medium select-none">{format(currentTime, "ss")}</span>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Time</p>
                            </div>

                            {/* Status Pill */}
                            <div className={`
                                px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-2
                                ${isWorking ? 'bg-amber-100 text-amber-700' :
                                    isDayComplete ? 'bg-emerald-100 text-emerald-700' :
                                        'bg-slate-100 text-slate-600'}
                            `}>
                                {isLoadingStatus ? (
                                    <Spinner className="w-3 h-3" />
                                ) : (
                                    <span className={`w-1.5 h-1.5 rounded-full ${isWorking ? 'bg-amber-600' : isDayComplete ? 'bg-emerald-600' : 'bg-slate-500'}`}></span>
                                )}
                                {isWorking ? 'Checked In' : isDayComplete ? 'Shift Completed' : 'Not Checked In'}
                            </div>

                            {/* Action Button */}
                            <Button
                                onClick={handleClockAction}
                                disabled={!!isDayComplete || clockInMutation.isPending || clockOutMutation.isPending || isLoadingStatus}
                                size="lg"
                                className={`
                                    w-full h-12 text-sm font-bold rounded-lg shadow-sm
                                    ${isWorking
                                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                    }
                                    ${isDayComplete ? 'opacity-50 cursor-not-allowed bg-slate-100 hover:bg-slate-100 text-slate-400 shadow-none border border-slate-200' : ''}
                                `}
                            >
                                {(clockInMutation.isPending || clockOutMutation.isPending) ? (
                                    <Spinner className="mr-2 h-4 w-4 text-white" />
                                ) : isWorking ? (
                                    "Check Out"
                                ) : (
                                    "Check In"
                                )}
                            </Button>

                            {/* Session Times */}
                            <div className="w-full grid grid-cols-2 text-sm">
                                <div className="text-center border-r border-slate-100">
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Clock In</p>
                                    <p className="font-mono font-semibold text-slate-700">
                                        {todayStatus?.clockIn ? format(new Date(todayStatus.clockIn), "HH:mm") : "--:--"}
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Clock Out</p>
                                    <p className="font-mono font-semibold text-slate-700">
                                        {todayStatus?.clockOut ? format(new Date(todayStatus.clockOut), "HH:mm") : "--:--"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Overview */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5 grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{history.length}</p>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">Days Present</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">100%</p>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">On Time</p>
                        </div>
                    </div>
                </div>

                {/* Logs Table */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <History className="w-4 h-4 text-slate-400" />
                            Attendance Log
                        </h2>
                        <Button variant="outline" size="sm" className="h-8 text-xs border-slate-200 text-slate-600 bg-white">
                            Export CSV
                        </Button>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50 border-b border-slate-100">
                                <TableRow className="hover:bg-transparent border-slate-100">
                                    <TableHead className="w-[140px] text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-6 py-3">Date</TableHead>
                                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3">Check In</TableHead>
                                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3">Check Out</TableHead>
                                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3">Duration</TableHead>
                                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3">Status</TableHead>
                                    <TableHead className="text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider pr-6 py-3">Location</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-slate-100">
                                {isLoadingHistory ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center">
                                            <Spinner className="w-5 h-5 text-indigo-600 mx-auto mb-2" />
                                            <span className="text-xs text-slate-400">Loading records...</span>
                                        </TableCell>
                                    </TableRow>
                                ) : history.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-48 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                                                    <Calendar className="w-5 h-5 text-slate-300" />
                                                </div>
                                                <p className="text-sm font-medium text-slate-900">No records found</p>
                                                <p className="text-xs text-slate-500 mt-1">Start checking in to see history.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    history.map((record: any) => (
                                        <TableRow key={record.id} className="hover:bg-slate-50 transition-colors border-slate-100">
                                            <TableCell className="font-semibold text-sm text-slate-900 pl-6 py-4">
                                                {format(new Date(record.date), "MMM d, yyyy")}
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-600 font-mono py-4">
                                                {format(new Date(record.clockIn), "HH:mm")}
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-600 font-mono py-4">
                                                {record.clockOut ? format(new Date(record.clockOut), "HH:mm") : <span className="text-slate-300">--:--</span>}
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-600 font-mono py-4">
                                                {record.clockOut ? (
                                                    <span className="text-slate-600 font-medium">
                                                        {calculateDuration(record.clockIn, record.clockOut)}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Active</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="py-4">
                                                {record.clockOut ? (
                                                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 font-bold uppercase tracking-tight text-[10px] px-2 py-0.5 shadow-none">Present</Badge>
                                                ) : (
                                                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-0 font-bold uppercase tracking-tight text-[10px] px-2 py-0.5 shadow-none">Ongoing</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right pr-6 py-4">
                                                <div className="flex items-center justify-end gap-1.5 text-xs font-medium text-slate-500">
                                                    <MapPin className="w-3 h-3 text-slate-400" />
                                                    Office
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    )
}
