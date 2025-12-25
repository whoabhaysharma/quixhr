"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Calendar as CalendarIcon,
    Plus,
    Trash2,
    ArrowLeft,
    Users,
    Clock,
    CalendarDays,
    Search
} from "lucide-react"
import { useHolidayCalendar, useAssignCalendar } from "@/lib/hooks/useHolidayCalendars"
import { useHolidays, useCreateHoliday, useDeleteHoliday } from "@/lib/hooks/useHolidays"
import { useMembers } from "@/lib/hooks/useMembers"
import { format, differenceInCalendarDays, isAfter } from "date-fns"
import { DatePicker } from "@/components/ui/date-picker"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Spinner } from "@/components/ui/spinner"

export default function CalendarDetailPage() {
    const { calendarId } = useParams()
    const router = useRouter()
    const { user } = useAuth()

    const { data: calendar, isLoading: isCalendarLoading } = useHolidayCalendar(calendarId as string)
    const { data: holidays = [], isLoading: isHolidaysLoading } = useHolidays(calendarId as string)
    const { data: members = [] } = useMembers()

    const createHolidayMutation = useCreateHoliday()
    const deleteHolidayMutation = useDeleteHoliday()
    const assignCalendarMutation = useAssignCalendar()

    const [isAddHolidayOpen, setIsAddHolidayOpen] = useState(false)
    const [isAssignOpen, setIsAssignOpen] = useState(false)
    const [newHoliday, setNewHoliday] = useState({ name: "", date: "", description: "", calendarId: calendarId as string })
    const [selectedDate, setSelectedDate] = useState<Date | undefined>()
    const [endDate, setEndDate] = useState<Date | undefined>()
    const [isRange, setIsRange] = useState(false)
    const [selectedMembers, setSelectedMembers] = useState<string[]>([])
    const [holidayToDelete, setHolidayToDelete] = useState<any>(null)

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'HR'
    const isLoading = isCalendarLoading || isHolidaysLoading

    if (isLoading) return <LoadingSkeleton />;
    if (!calendar) return <div className="p-20 text-center font-medium">Calendar not found</div>

    const handleAddHoliday = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await createHolidayMutation.mutateAsync({
                ...newHoliday,
                date: selectedDate?.toISOString() || "",
                endDate: (isRange && endDate) ? endDate.toISOString() : undefined,
                calendarId: calendar.id
            })
            setIsAddHolidayOpen(false)
            setNewHoliday({ name: "", date: "", description: "", calendarId: calendar.id })
            setSelectedDate(undefined)
            setEndDate(undefined)
            setIsRange(false)
        } catch (error) { console.error(error) }
    }

    const confirmDelete = async () => {
        if (!holidayToDelete) return
        await deleteHolidayMutation.mutateAsync(holidayToDelete.id)
        setHolidayToDelete(null)
    }

    const totalHolidayDays = holidays.reduce((acc: number, holiday: any) => {
        const start = new Date(holiday.date)
        const end = holiday.endDate ? new Date(holiday.endDate) : null
        return acc + (end ? differenceInCalendarDays(end, start) + 1 : 1)
    }, 0)

    return (
        <div className="space-y-6">
            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/holidays')}
                    className="text-slate-600 hover:text-indigo-600 pl-0 hover:bg-transparent"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Directory
                </Button>
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-medium border-0 px-3 py-1">
                        {calendar.year} Academic Year
                    </Badge>
                </div>
            </div>

            {/* Hero Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        {calendar.name}
                    </h1>
                    <p className="text-slate-500 text-sm max-w-2xl leading-relaxed">
                        {calendar.description || "Manage and track public holidays and corporate events."}
                    </p>
                </div>

                {isAdmin && (
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setIsAssignOpen(true)}
                            className="border-slate-200"
                        >
                            <Users className="w-4 h-4 mr-2 text-slate-500" />
                            Manage Access
                        </Button>
                        <Button
                            onClick={() => setIsAddHolidayOpen(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Holiday
                        </Button>
                    </div>
                )}
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard icon={<CalendarDays className="w-5 h-5 text-indigo-600" />} label="Total Holiday Days" value={totalHolidayDays} />
                <StatCard icon={<Clock className="w-5 h-5 text-emerald-600" />} label="Upcoming Events" value={holidays.filter((h: any) => isAfter(new Date(h.date), new Date())).length} />
                <StatCard icon={<Users className="w-5 h-5 text-amber-600" />} label="Assigned Members" value={members.length} />
            </div>

            {/* Main Content */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                        Events Schedule
                    </h2>
                </div>

                {holidays.length === 0 ? (
                    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CalendarIcon className="w-6 h-6 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-1">No holidays scheduled</h3>
                        <p className="text-slate-500 text-sm max-w-xs mx-auto mb-6">
                            Start adding holidays to this calendar.
                        </p>
                        {isAdmin && (
                            <Button variant="outline" onClick={() => setIsAddHolidayOpen(true)}>
                                Create First Holiday
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="divide-y divide-slate-100">
                            {holidays.map((holiday: any) => (
                                <HolidayRow
                                    key={holiday.id}
                                    holiday={holiday}
                                    isAdmin={isAdmin}
                                    onDelete={() => setHolidayToDelete(holiday)}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            <AssignModal
                isOpen={isAssignOpen}
                setIsOpen={setIsAssignOpen}
                members={members}
                selectedMembers={selectedMembers}
                setSelectedMembers={setSelectedMembers}
                onConfirm={() => assignCalendarMutation.mutateAsync({ calendarId: calendar.id, userIds: selectedMembers })}
                isPending={assignCalendarMutation.isPending}
            />

            {/* Add Holiday Dialog */}
            <Dialog open={isAddHolidayOpen} onOpenChange={setIsAddHolidayOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Add New Holiday</DialogTitle>
                        <DialogDescription>Define a single day or range for the new holiday.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddHoliday} className="space-y-6 pt-4">
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Event Name</Label>
                                <Input id="name" placeholder="e.g. Annual Winter Break" value={newHoliday.name} onChange={e => setNewHoliday({ ...newHoliday, name: e.target.value })} required />
                            </div>

                            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <Checkbox id="range" checked={isRange} onCheckedChange={(c) => setIsRange(c as boolean)} />
                                <Label htmlFor="range" className="text-sm cursor-pointer">This is a multi-day event range</Label>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>{isRange ? "Starts On" : "Date"}</Label>
                                    <DatePicker date={selectedDate} setDate={setSelectedDate} className="w-full" />
                                </div>
                                {isRange && (
                                    <div className="space-y-2">
                                        <Label>Ends On</Label>
                                        <DatePicker date={endDate} setDate={setEndDate} className="w-full" />
                                    </div>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label>Notes (Optional)</Label>
                                <Textarea placeholder="Brief details..." value={newHoliday.description} onChange={e => setNewHoliday({ ...newHoliday, description: e.target.value })} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button type="button" variant="ghost" onClick={() => setIsAddHolidayOpen(false)}>Cancel</Button>
                            <Button type="submit" className="bg-indigo-600 text-white hover:bg-indigo-700" disabled={createHolidayMutation.isPending}>
                                {createHolidayMutation.isPending ? "Saving..." : "Save Holiday"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!holidayToDelete} onOpenChange={(open) => !open && setHolidayToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Holiday?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete <span className="font-semibold text-slate-900">"{holidayToDelete?.name}"</span>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white" disabled={deleteHolidayMutation.isPending}>
                            {deleteHolidayMutation.isPending ? "Deleting..." : "Delete Holiday"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: number | string }) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start justify-between">
            <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
                <div className="text-2xl font-bold text-slate-900">{value}</div>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
        </div>
    )
}

function HolidayRow({ holiday, isAdmin, onDelete }: any) {
    const startDate = new Date(holiday.date);
    const endDate = holiday.endDate ? new Date(holiday.endDate) : null;
    const duration = endDate ? differenceInCalendarDays(endDate, startDate) + 1 : 1;

    return (
        <div className="group flex flex-col md:flex-row md:items-center justify-between p-5 hover:bg-slate-50 transition-colors gap-4">
            <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{format(startDate, 'MMM')}</span>
                    <span className="text-xl font-bold leading-none">{format(startDate, 'd')}</span>
                </div>

                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h3 className="text-sm font-bold text-slate-900">
                            {holiday.name}
                        </h3>
                        {endDate && (
                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-0 px-2 py-0.5 text-[10px] font-bold">
                                {duration} DAYS
                            </Badge>
                        )}
                    </div>

                    <div className="flex items-center text-sm text-slate-500 font-medium">
                        <Clock className="w-3.5 h-3.5 mr-2 text-slate-400" />
                        {endDate ? (
                            <span>
                                {format(startDate, 'MMM d')} <span className="text-slate-300 mx-1">→</span> {format(endDate, 'MMM d, yyyy')}
                            </span>
                        ) : (
                            format(startDate, 'EEEE, MMMM do, yyyy')
                        )}
                    </div>
                </div>
            </div>

            {isAdmin && (
                <div className="flex items-center pl-4 md:pl-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50"
                        onClick={onDelete}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            )}
        </div>
    )
}

function AssignModal({ isOpen, setIsOpen, members, selectedMembers, setSelectedMembers, onConfirm, isPending }: any) {
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle>Assign Calendar Access</DialogTitle>
                    <DialogDescription>Select team members.</DialogDescription>
                </DialogHeader>
                <div className="p-6 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input placeholder="Search members..." className="pl-9" />
                    </div>
                    <div className="space-y-1 max-h-[300px] overflow-y-auto pr-2">
                        {members.map((member: any) => (
                            <label key={member.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs uppercase">
                                        {member.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">{member.name}</p>
                                        <p className="text-xs text-slate-500">{member.email}</p>
                                    </div>
                                </div>
                                <Checkbox
                                    checked={selectedMembers.includes(member.id)}
                                    onCheckedChange={(checked) => {
                                        if (checked) setSelectedMembers([...selectedMembers, member.id])
                                        else setSelectedMembers(selectedMembers.filter((id: string) => id !== member.id))
                                    }}
                                />
                            </label>
                        ))}
                    </div>
                    <Button onClick={onConfirm} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isPending}>
                        {isPending ? "Updating..." : "Update Permissions"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function LoadingSkeleton() {
    return (
        <div className="max-w-[1400px] mx-auto p-4 space-y-8 animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/4"></div>
            <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>)}
            </div>
            <div className="space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-200 rounded-xl"></div>)}
            </div>
        </div>
    )
}