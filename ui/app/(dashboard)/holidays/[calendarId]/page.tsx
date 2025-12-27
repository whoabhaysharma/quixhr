"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import {
    ArrowLeft,
    Plus,
    Trash2,
    Calendar as CalendarIcon,
    Clock,
    Edit2
} from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { calendarService, type WeeklyRule, type Holiday } from "@/lib/services/calendar"
import Link from "next/link"
import { toast } from "sonner"
import { format } from "date-fns"

const DAYS = [
    { label: "Sunday", value: 0 },
    { label: "Monday", value: 1 },
    { label: "Tuesday", value: 2 },
    { label: "Wednesday", value: 3 },
    { label: "Thursday", value: 4 },
    { label: "Friday", value: 5 },
    { label: "Saturday", value: 6 },
]

const RULE_TYPES: Array<{ value: WeeklyRule['rule'], label: string, color: string }> = [
    { value: 'WORKING', label: 'Working', color: 'bg-green-100 text-green-700 border-green-200' },
    { value: 'OFF', label: 'Off', color: 'bg-red-100 text-red-700 border-red-200' },
    { value: 'ALTERNATE', label: 'Alternate', color: 'bg-amber-100 text-amber-700 border-amber-200' },
]

export default function CalendarDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { user } = useAuth()
    const queryClient = useQueryClient()
    const calendarId = params.calendarId as string

    const { data: calendarResponse, isLoading } = useQuery({
        queryKey: ['calendar', calendarId],
        queryFn: () => calendarService.getCalendar(calendarId)
    })

    const calendar = calendarResponse?.data

    const updateRuleMutation = useMutation({
        mutationFn: (rule: WeeklyRule) => calendarService.updateWeeklyRule(calendarId, rule),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['calendar', calendarId] })
            toast.success("Weekly rule updated")
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || "Failed to update rule")
        }
    })

    const addHolidayMutation = useMutation({
        mutationFn: (holiday: Omit<Holiday, 'id'>) => calendarService.addHoliday(calendarId, holiday),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['calendar', calendarId] })
            toast.success("Holiday added")
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || "Failed to add holiday")
        }
    })

    const deleteHolidayMutation = useMutation({
        mutationFn: (holidayId: string) => calendarService.deleteHoliday(calendarId, holidayId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['calendar', calendarId] })
            toast.success("Holiday deleted")
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || "Failed to delete holiday")
        }
    })

    const [isHolidayDialogOpen, setIsHolidayDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isRulesDialogOpen, setIsRulesDialogOpen] = useState(false)
    const [newHoliday, setNewHoliday] = useState({
        name: "",
        startDate: "",
        endDate: "",
    })
    const [editSettings, setEditSettings] = useState({
        name: "",
        dayStartTime: "",
        midDayCutoff: "",
        dayEndTime: "",
    })

    const updateCalendarMutation = useMutation({
        mutationFn: (data: any) => calendarService.updateCalendar(calendarId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['calendar', calendarId] })
            toast.success("Calendar updated")
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || "Failed to update calendar")
        }
    })

    const isAdmin = user?.role === 'HR_ADMIN' || user?.role === 'SUPER_ADMIN'

    const handleRuleChange = (dayOfWeek: number, rule: WeeklyRule['rule']) => {
        updateRuleMutation.mutate({ dayOfWeek, rule })
    }

    const handleEditCalendar = () => {
        if (calendar) {
            setEditSettings({
                name: calendar.name,
                dayStartTime: calendar.dayStartTime,
                midDayCutoff: calendar.midDayCutoff,
                dayEndTime: calendar.dayEndTime,
            })
            setIsEditDialogOpen(true)
        }
    }

    const handleSaveCalendar = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await updateCalendarMutation.mutateAsync(editSettings)
            setIsEditDialogOpen(false)
        } catch (error) {
            // Error handled by mutation
        }
    }

    const handleAddHoliday = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await addHolidayMutation.mutateAsync(newHoliday)
            setIsHolidayDialogOpen(false)
            setNewHoliday({ name: "", startDate: "", endDate: "" })
        } catch (error) {
            // Error handled by mutation
        }
    }

    const handleDeleteHoliday = async (holidayId: string) => {
        if (!confirm("Are you sure you want to delete this holiday?")) return
        try {
            await deleteHolidayMutation.mutateAsync(holidayId)
        } catch (error) {
            // Error handled by mutation
        }
    }

    const getRuleForDay = (dayOfWeek: number): WeeklyRule['rule'] => {
        const rule = calendar?.weeklyRules?.find(r => r.dayOfWeek === dayOfWeek)
        return rule?.rule || 'WORKING'
    }

    const getRuleColor = (rule: WeeklyRule['rule']) => {
        return RULE_TYPES.find(r => r.value === rule)?.color || 'bg-gray-100 text-gray-700'
    }

    if (isLoading) {
        return <CalendarDetailSkeleton />
    }

    if (!calendar) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-slate-900">Calendar not found</h2>
                <Link href="/holidays">
                    <Button className="mt-4" variant="outline">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Calendars
                    </Button>
                </Link>
            </div>
        )
    }

    // Calculate total holiday days
    const totalHolidayDays = calendar.holidays?.reduce((total, holiday) => {
        const startDate = new Date(holiday.startDate)
        const endDate = new Date(holiday.endDate)
        const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
        return total + days
    }, 0) || 0

    return (
        <div className="space-y-6">
            {/* Professional Header */}
            <div className="space-y-4">
                {/* Back Button */}
                <Link href="/holidays">
                    <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 -ml-2">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Calendars
                    </Button>
                </Link>

                {/* Title and Actions */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-slate-900">{calendar.name}</h1>
                            <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 font-semibold">
                                {calendar.year}
                            </Badge>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                            Manage working hours, weekly schedules, and holiday dates
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {isAdmin && (
                            <>
                                <Button variant="outline" size="sm" onClick={() => setIsRulesDialogOpen(true)}>
                                    <Edit2 className="w-4 h-4 mr-2" />
                                    Edit Rules
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleEditCalendar}>
                                    <Edit2 className="w-4 h-4 mr-2" />
                                    Edit Settings
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Compact Stats Cards */}
                <div className="grid grid-cols-3 gap-4">
                    <Card className="p-2">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Clock className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-slate-600">Work Hours</p>
                                    <p className="text-lg font-bold text-slate-900">
                                        {calendar.dayStartTime} - {calendar.dayEndTime}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="p-2">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Clock className="w-5 h-5 text-amber-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-slate-600">Mid-day Cutoff</p>
                                    <p className="text-lg font-bold text-slate-900">{calendar.midDayCutoff}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="p-2">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <CalendarIcon className="w-5 h-5 text-green-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-slate-600">Holiday Days</p>
                                    <p className="text-lg font-bold text-slate-900">{totalHolidayDays}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Edit Calendar Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Edit Calendar Settings</DialogTitle>
                        <DialogDescription>
                            Update calendar name and work hours
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveCalendar} className="space-y-4 mt-4">
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="editName">Calendar Name</Label>
                                <Input
                                    id="editName"
                                    value={editSettings.name}
                                    onChange={(e) => setEditSettings({ ...editSettings, name: e.target.value })}
                                    placeholder="e.g., India Regional Holidays 2025"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="grid gap-2">
                                    <Label htmlFor="editDayStartTime">Start Time</Label>
                                    <Input
                                        id="editDayStartTime"
                                        type="time"
                                        value={editSettings.dayStartTime}
                                        onChange={(e) => setEditSettings({ ...editSettings, dayStartTime: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="editMidDayCutoff">Mid-Day</Label>
                                    <Input
                                        id="editMidDayCutoff"
                                        type="time"
                                        value={editSettings.midDayCutoff}
                                        onChange={(e) => setEditSettings({ ...editSettings, midDayCutoff: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="editDayEndTime">End Time</Label>
                                    <Input
                                        id="editDayEndTime"
                                        type="time"
                                        value={editSettings.dayEndTime}
                                        onChange={(e) => setEditSettings({ ...editSettings, dayEndTime: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsEditDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={updateCalendarMutation.isPending}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                                {updateCalendarMutation.isPending ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Weekly Rules Modal */}
            <Dialog open={isRulesDialogOpen} onOpenChange={setIsRulesDialogOpen}>
                <DialogContent className="sm:max-w-[900px]">
                    <DialogHeader>
                        <DialogTitle>Edit Weekly Rules</DialogTitle>
                        <DialogDescription>
                            Configure which days are working days, off days, or alternate days
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
                            {DAYS.map((day) => {
                                const currentRule = getRuleForDay(day.value)
                                return (
                                    <div key={day.value} className="space-y-2">
                                        <Label className="text-xs font-medium text-slate-600">{day.label}</Label>
                                        <div className="flex flex-col gap-1">
                                            {RULE_TYPES.map((ruleType) => (
                                                <button
                                                    key={ruleType.value}
                                                    onClick={() => handleRuleChange(day.value, ruleType.value)}
                                                    disabled={updateRuleMutation.isPending}
                                                    className={`px-3 py-2 rounded-md text-xs font-medium border transition-all ${currentRule === ruleType.value
                                                        ? ruleType.color + ' ring-2 ring-offset-1 ring-current'
                                                        : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                                                        } cursor-pointer`}
                                                >
                                                    {ruleType.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                        <Button
                            type="button"
                            onClick={() => setIsRulesDialogOpen(false)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            Done
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Holidays Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl">Holiday Schedule</CardTitle>
                            <CardDescription className="mt-1">
                                {calendar.holidays?.length || 0} holiday{(calendar.holidays?.length || 0) !== 1 ? 's' : ''} scheduled • {totalHolidayDays} total days off
                            </CardDescription>
                        </div>
                        {isAdmin && (
                            <Dialog open={isHolidayDialogOpen} onOpenChange={setIsHolidayDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Holiday
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[500px]">
                                    <DialogHeader>
                                        <DialogTitle>Add Holiday</DialogTitle>
                                        <DialogDescription>
                                            Add a new holiday or holiday range to this calendar
                                        </DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleAddHoliday} className="space-y-4 mt-4">
                                        <div className="grid gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="name">Holiday Name</Label>
                                                <Input
                                                    id="name"
                                                    value={newHoliday.name}
                                                    onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                                                    placeholder="e.g., Christmas"
                                                    required
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="startDate">Start Date</Label>
                                                    <Input
                                                        id="startDate"
                                                        type="date"
                                                        value={newHoliday.startDate}
                                                        onChange={(e) => setNewHoliday({ ...newHoliday, startDate: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="endDate">End Date</Label>
                                                    <Input
                                                        id="endDate"
                                                        type="date"
                                                        value={newHoliday.endDate}
                                                        onChange={(e) => setNewHoliday({ ...newHoliday, endDate: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-3 pt-4">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                onClick={() => setIsHolidayDialogOpen(false)}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={addHolidayMutation.isPending}
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                            >
                                                {addHolidayMutation.isPending ? "Adding..." : "Add Holiday"}
                                            </Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {!calendar.holidays || calendar.holidays.length === 0 ? (
                        <div className="text-center py-16 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                <CalendarIcon className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-base font-semibold text-slate-900 mb-2">No holidays scheduled</h3>
                            <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
                                {isAdmin
                                    ? "Get started by adding your first holiday to this calendar"
                                    : "No holidays have been added to this calendar yet"}
                            </p>
                            {isAdmin && (
                                <Button
                                    onClick={() => setIsHolidayDialogOpen(true)}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Your First Holiday
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {calendar.holidays
                                .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                                .map((holiday: any) => {
                                    const startDate = new Date(holiday.startDate)
                                    const endDate = new Date(holiday.endDate)
                                    const isSingleDay = holiday.startDate === holiday.endDate
                                    const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

                                    return (
                                        <div
                                            key={holiday.id}
                                            className="flex items-center justify-between py-4 first:pt-0 last:pb-0 hover:bg-slate-50 -mx-6 px-6 transition-colors"
                                        >
                                            <div className="flex items-start gap-4 flex-1">
                                                <div className="flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl px-4 py-3 min-w-[80px] shadow-sm">
                                                    <span className="text-3xl font-bold text-indigo-600">
                                                        {format(startDate, 'dd')}
                                                    </span>
                                                    <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
                                                        {format(startDate, 'MMM')}
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0 pt-1">
                                                    <h4 className="font-semibold text-slate-900 text-lg mb-1">{holiday.name}</h4>
                                                    <div className="flex items-center gap-3 text-sm text-slate-600">
                                                        <span className="flex items-center gap-1.5">
                                                            <CalendarIcon className="w-4 h-4 text-slate-400" />
                                                            {isSingleDay ? (
                                                                format(startDate, 'EEEE, MMMM dd, yyyy')
                                                            ) : (
                                                                <>
                                                                    {format(startDate, 'MMM dd')} - {format(endDate, 'MMM dd, yyyy')}
                                                                </>
                                                            )}
                                                        </span>
                                                        {!isSingleDay && (
                                                            <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 font-semibold border-indigo-100">
                                                                {duration} day{duration !== 1 ? 's' : ''}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {isAdmin && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 ml-4"
                                                    onClick={() => handleDeleteHoliday(holiday.id)}
                                                    disabled={deleteHolidayMutation.isPending}
                                                >
                                                    {deleteHolidayMutation.isPending ? (
                                                        <Spinner className="w-4 h-4" />
                                                    ) : (
                                                        <Trash2 className="w-4 h-4" />
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                    )
                                })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

function CalendarDetailSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-20" />
                <div className="flex-1">
                    <Skeleton className="h-8 w-64 mb-2" />
                    <Skeleton className="h-4 w-96" />
                </div>
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-7 gap-3">
                        {[...Array(7)].map((_, i) => (
                            <Skeleton key={i} className="h-32" />
                        ))}
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                            <Skeleton key={i} className="h-16" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}