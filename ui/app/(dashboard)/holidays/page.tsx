"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import {
    Plus,
    Trash2,
    Calendar,
    Users,
    ChevronRight,
    MapPin
} from "lucide-react"
import { useHolidayCalendars, useCreateCalendar, useDeleteCalendar } from "@/lib/hooks/useHolidayCalendars"
import Link from "next/link"

export default function HolidaysPage() {
    const { user } = useAuth()
    const { data: calendars = [], isLoading } = useHolidayCalendars()
    const createCalendarMutation = useCreateCalendar()
    const deleteCalendarMutation = useDeleteCalendar()

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [newCalendar, setNewCalendar] = useState({
        name: "",
        description: "",
        year: new Date().getFullYear(),
    })

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'HR'

    const handleCreateCalendar = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await createCalendarMutation.mutateAsync(newCalendar)
            setIsCreateDialogOpen(false)
            setNewCalendar({ name: "", description: "", year: new Date().getFullYear() })
        } catch (error) {
            console.error("Failed to create calendar", error)
        }
    }

    const handleDeleteCalendar = async (id: string, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (!confirm("Are you sure you want to delete this calendar? All holidays will be removed.")) return
        try {
            await deleteCalendarMutation.mutateAsync(id)
        } catch (error) {
            console.error("Failed to delete calendar", error)
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
                        View and manage holiday schedules for your organization.
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
                                    Add a new calendar for a specific year or region.
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
                                            placeholder="e.g., India Regional Holidays"
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
                                    <div className="grid gap-2">
                                        <Label htmlFor="description">Description (Optional)</Label>
                                        <Textarea
                                            id="description"
                                            value={newCalendar.description}
                                            onChange={(e) => setNewCalendar({ ...newCalendar, description: e.target.value })}
                                            placeholder="Brief description..."
                                            rows={3}
                                            className="resize-none"
                                        />
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
                        <Calendar className="w-6 h-6 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">No Holiday Calendars</h3>
                    <p className="text-slate-500 text-sm">
                        {isAdmin ? "Create your first calendar to get started." : "No calendars assigned to you."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {calendars.map((calendar: any) => {
                        const isAssigned = user?.holidayCalendarId === calendar.id
                        return (
                            <Link key={calendar.id} href={`/holidays/${calendar.id}`} className="block h-full">
                                <div className={`h-full bg-white rounded-xl border shadow-sm transition-all p-5 flex flex-col justify-between group ${isAssigned ? 'border-indigo-600 ring-1 ring-indigo-600/20' : 'border-slate-200 hover:border-indigo-300 hover:shadow-md'}`}>
                                    <div>
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex gap-2">
                                                <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-100 font-medium border-0">
                                                    {calendar.year}
                                                </Badge>
                                                {user?.holidayCalendarId === calendar.id && (
                                                    <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 font-bold border-0">
                                                        My Calendar
                                                    </Badge>
                                                )}
                                            </div>
                                            {isAdmin && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={(e) => handleDeleteCalendar(calendar.id, e)}
                                                    disabled={deleteCalendarMutation.isPending && deleteCalendarMutation.variables === calendar.id}
                                                >
                                                    {deleteCalendarMutation.isPending && deleteCalendarMutation.variables === calendar.id ? (
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
                                        <p className="text-sm text-slate-500 line-clamp-2 mb-6 h-10">
                                            {calendar.description || "No description provided."}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                        <div className="flex gap-4 text-xs font-medium text-slate-500">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span>{calendar._count?.holidays || 0}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Users className="w-3.5 h-3.5" />
                                                <span>{calendar._count?.users || 0}</span>
                                            </div>
                                        </div>
                                        <span className="text-indigo-600 text-xs font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            View <ChevronRight className="w-3 h-3" />
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        )
                    })}
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
                            <Skeleton className="h-4 w-12" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
