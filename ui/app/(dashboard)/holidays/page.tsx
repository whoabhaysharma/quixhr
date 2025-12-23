"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import {
    Calendar as CalendarIcon,
    Plus,
    Edit,
    Trash2,
    Users,
    CalendarDays,
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

    const handleDeleteCalendar = async (id: string) => {
        if (!confirm("Are you sure you want to delete this calendar? All holidays will be removed.")) return
        try {
            await deleteCalendarMutation.mutateAsync(id)
        } catch (error) {
            console.error("Failed to delete calendar", error)
        }
    }

    if (isLoading) {
        return (
            <div className="-m-4 lg:-m-8 bg-[#f8fafc] min-h-[calc(100vh-4rem)] pb-20">
                <div className="max-w-[1400px] mx-auto px-6 pt-8 space-y-8">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                        <div className="space-y-1">
                            <Skeleton className="h-8 w-64" />
                            <Skeleton className="h-4 w-96" />
                        </div>
                        <Skeleton className="h-10 w-40" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <Card key={i} className="border-none shadow-sm bg-white h-48">
                                <CardHeader className="pb-3">
                                    <Skeleton className="h-6 w-3/4 mb-2" />
                                    <Skeleton className="h-4 w-1/4" />
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <Skeleton className="h-4 w-20" />
                                            <Skeleton className="h-4 w-20" />
                                        </div>
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="-m-4 lg:-m-8 bg-[#f8fafc] min-h-[calc(100vh-4rem)] pb-20">
            <div className="max-w-[1400px] mx-auto px-6 pt-8 space-y-8">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Holiday Calendars</h1>
                        <p className="text-slate-500 text-sm max-w-2xl leading-relaxed italic">
                            {isAdmin ? "Manage holiday calendars and assign them to employees" : "View your assigned holiday calendar"}
                        </p>
                    </div>
                    {isAdmin && (
                        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 border-none">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Calendar
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle>Create Holiday Calendar</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleCreateCalendar} className="space-y-5 mt-5">
                                    <div className="grid gap-5">
                                        <div className="grid gap-2">
                                            <Label htmlFor="name" className="text-sm font-semibold">Calendar Name</Label>
                                            <Input
                                                id="name"
                                                value={newCalendar.name}
                                                onChange={(e) => setNewCalendar({ ...newCalendar, name: e.target.value })}
                                                placeholder="e.g., India Regional Holidays"
                                                className="h-10"
                                                required
                                            />
                                            <p className="text-[11px] text-slate-500">A recognizable name for this holiday group.</p>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="year" className="text-sm font-semibold">Calendar Year</Label>
                                            <Input
                                                id="year"
                                                type="number"
                                                value={newCalendar.year}
                                                onChange={(e) => setNewCalendar({ ...newCalendar, year: parseInt(e.target.value) })}
                                                min={2024}
                                                max={2030}
                                                className="h-10 w-full md:w-1/2"
                                                required
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="description" className="text-sm font-semibold">Description <span className="text-slate-400 font-normal">(Optional)</span></Label>
                                            <Textarea
                                                id="description"
                                                value={newCalendar.description}
                                                onChange={(e) => setNewCalendar({ ...newCalendar, description: e.target.value })}
                                                placeholder="Add details about which employees this calendar applies to..."
                                                rows={4}
                                                className="resize-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
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
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100"
                                        >
                                            {createCalendarMutation.isPending ? (
                                                <>
                                                    <Spinner className="mr-2 h-4 w-4 animate-spin" />
                                                    Creating...
                                                </>
                                            ) : "Create Calendar"}
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                {/* Calendars Grid */}
                {calendars.length === 0 ? (
                    <Card className="border-none shadow-sm bg-white">
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <CalendarIcon className="w-16 h-16 text-slate-300 mb-4" />
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Holiday Calendars</h3>
                            <p className="text-slate-500 text-sm text-center max-w-md">
                                {isAdmin
                                    ? "Get started by creating your first holiday calendar"
                                    : "No holiday calendar has been assigned to you yet"}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {calendars.map((calendar) => (
                            <Card
                                key={calendar.id}
                                className="border-none shadow-sm bg-white hover:shadow-lg transition-shadow cursor-pointer group"
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="text-lg font-bold text-slate-900 mb-1">
                                                {calendar.name}
                                            </CardTitle>
                                            <Badge variant="outline" className="text-xs">
                                                {calendar.year}
                                            </Badge>
                                        </div>
                                        {isAdmin && (
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    disabled={deleteCalendarMutation.isPending && deleteCalendarMutation.variables === calendar.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleDeleteCalendar(calendar.id)
                                                    }}
                                                >
                                                    {deleteCalendarMutation.isPending && deleteCalendarMutation.variables === calendar.id ? (
                                                        <Spinner className="w-4 h-4" />
                                                    ) : (
                                                        <Trash2 className="w-4 h-4 text-red-500" />
                                                    )}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    {calendar.description && (
                                        <p className="text-sm text-slate-500 mt-2">{calendar.description}</p>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    <Link href={`/holidays/${calendar.id}`}>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <CalendarDays className="w-4 h-4" />
                                                    <span>{calendar._count?.holidays || 0} Holidays</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <Users className="w-4 h-4" />
                                                    <span>{calendar._count?.users || 0} Assigned</span>
                                                </div>
                                            </div>
                                            <Button
                                                variant="outline"
                                                className="w-full text-slate-900 border-slate-300 hover:bg-slate-50"
                                            >
                                                View Details
                                            </Button>
                                        </div>
                                    </Link>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
