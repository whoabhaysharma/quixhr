"use client"

import { useState } from "react"
import ComingSoonView from "@/components/views/ComingSoonView"
const COMING_SOON = true
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import {
    Plus,
    Trash2,
    Calendar as CalendarIcon,
    Clock,
    ChevronRight
} from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { calendarService, type CreateCalendarDto } from "@/lib/services/calendar"
import Link from "next/link"
import { toast } from "sonner"

export default function HolidaysPage() {
    if (COMING_SOON) {
        return <ComingSoonView
            title="Holiday Calendars"
            description="View and manage organization holiday schedules and working hours. This feature is currently under development."
        />
    }
    const { user } = useAuth()
    const queryClient = useQueryClient()

    const { data: calendarsResponse, isLoading } = useQuery({
        queryKey: ['calendars'],
        queryFn: () => calendarService.getCalendars()
    })

    const calendars = calendarsResponse?.data || []

    const createCalendarMutation = useMutation({
        mutationFn: (data: CreateCalendarDto) => calendarService.createCalendar(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['calendars'] })
            toast.success("Calendar created successfully")
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || "Failed to create calendar")
        }
    })

    const deleteCalendarMutation = useMutation({
        mutationFn: (id: string) => calendarService.deleteCalendar(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['calendars'] })
            toast.success("Calendar deleted successfully")
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || "Failed to delete calendar")
        }
    })

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [newCalendar, setNewCalendar] = useState({
        name: "",
        year: new Date().getFullYear(),
        dayStartTime: "09:00",
        midDayCutoff: "13:00",
        dayEndTime: "18:00",
    })

    const isAdmin = user?.role === 'HR_ADMIN' || user?.role === 'SUPER_ADMIN'

    const handleCreateCalendar = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!user?.employee?.companyId) {
            toast.error("Company ID not found")
            return
        }

        try {
            await createCalendarMutation.mutateAsync({
                ...newCalendar,
                companyId: user.employee.companyId
            })
            setIsCreateDialogOpen(false)
            setNewCalendar({
                name: "",
                year: new Date().getFullYear(),
                dayStartTime: "09:00",
                midDayCutoff: "13:00",
                dayEndTime: "18:00"
            })
        } catch (error) {
            // Error handled by mutation
        }
    }

    const handleDeleteCalendar = async (id: string, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (!confirm("Are you sure you want to delete this calendar? All holidays and rules will be removed.")) return
        try {
            await deleteCalendarMutation.mutateAsync(id)
        } catch (error) {
            // Error handled by mutation
        }
    }

    if (isLoading) {
        return <HolidaysSkeleton />
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Holiday Calendars</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        View and manage holiday schedules and working hours for your organization.
                    </p>
                </div>
                {isAdmin && (
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                <Plus className="w-4 h-4 mr-2" />
                                Create Calendar
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Create Holiday Calendar</DialogTitle>
                                <DialogDescription>
                                    Add a new calendar with working hours and holiday schedule.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreateCalendar} className="space-y-4 mt-4">
                                <div className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Calendar Name</Label>
                                        <Input
                                            id="name"
                                            value={newCalendar.name}
                                            onChange={(e) => setNewCalendar({ ...newCalendar, name: e.target.value })}
                                            placeholder="e.g., India Regional Holidays 2025"
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="year">Year</Label>
                                        <Input
                                            id="year"
                                            type="number"
                                            value={newCalendar.year}
                                            onChange={(e) => setNewCalendar({ ...newCalendar, year: parseInt(e.target.value) })}
                                            min={2024}
                                            max={2030}
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="grid gap-2">
                                            <Label htmlFor="dayStartTime">Start Time</Label>
                                            <Input
                                                id="dayStartTime"
                                                type="time"
                                                value={newCalendar.dayStartTime}
                                                onChange={(e) => setNewCalendar({ ...newCalendar, dayStartTime: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="midDayCutoff">Mid-Day</Label>
                                            <Input
                                                id="midDayCutoff"
                                                type="time"
                                                value={newCalendar.midDayCutoff}
                                                onChange={(e) => setNewCalendar({ ...newCalendar, midDayCutoff: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="dayEndTime">End Time</Label>
                                            <Input
                                                id="dayEndTime"
                                                type="time"
                                                value={newCalendar.dayEndTime}
                                                onChange={(e) => setNewCalendar({ ...newCalendar, dayEndTime: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setIsCreateDialogOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={createCalendarMutation.isPending}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                    >
                                        {createCalendarMutation.isPending ? "Creating..." : "Create Calendar"}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* Content */}
            {calendars.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CalendarIcon className="w-6 h-6 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">No Holiday Calendars</h3>
                    <p className="text-slate-500 text-sm">
                        {isAdmin ? "Create your first calendar to get started." : "No calendars available."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {calendars.map((calendar: any) => (
                        <Link key={calendar.id} href={`/e/holidays/view?calendarId=${calendar.id}`} className="block h-full">
                            <div className="h-full bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md shadow-sm transition-all p-5 flex flex-col justify-between group">
                                <div>
                                    <div className="flex justify-between items-start mb-3">
                                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-100 font-medium border-0">
                                            {calendar.year}
                                        </Badge>
                                        {isAdmin && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={(e) => handleDeleteCalendar(calendar.id, e)}
                                                disabled={deleteCalendarMutation.isPending}
                                            >
                                                {deleteCalendarMutation.isPending ? (
                                                    <Spinner className="w-3 h-3" />
                                                ) : (
                                                    <Trash2 className="w-4 h-4" />
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2 truncate">
                                        {calendar.name}
                                    </h3>
                                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                                        <Clock className="w-4 h-4" />
                                        <span>{calendar.dayStartTime} - {calendar.dayEndTime}</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                    <div className="flex gap-4 text-xs font-medium text-slate-500">
                                        <div className="flex items-center gap-1.5">
                                            <CalendarIcon className="w-3.5 h-3.5" />
                                            <span>{calendar.holidays?.length || 0} holidays</span>
                                        </div>
                                    </div>
                                    <span className="text-indigo-600 text-xs font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        View <ChevronRight className="w-3 h-3" />
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}

function HolidaysSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-72" />
                </div>
                <Skeleton className="h-10 w-32" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 h-48">
                        <div className="flex justify-between mb-4">
                            <Skeleton className="h-6 w-16 rounded-full" />
                        </div>
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-full mb-6" />
                        <div className="border-t border-slate-50 pt-4 flex gap-4">
                            <Skeleton className="h-4 w-12" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
