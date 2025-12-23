"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Calendar as CalendarIcon,
    Plus,
    Trash2,
    ArrowLeft,
    MoreVertical,
    Users,
    Clock,
    CalendarDays,
    Info,
    ChevronRight,
    Search
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

    const totalHolidayDays = holidays.reduce((acc, holiday) => {
        const start = new Date(holiday.date)
        const end = holiday.endDate ? new Date(holiday.endDate) : null
        return acc + (end ? differenceInCalendarDays(end, start) + 1 : 1)
    }, 0)

    return (
        <div className="-m-4 lg:-m-8 bg-[#f8fafc] min-h-[calc(100vh-4rem)] pb-20">
            {/* Top Navigation Bar */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/holidays')}
                        className="text-slate-600 hover:text-indigo-600 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Directory
                    </Button>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-none px-3 py-1">
                            {calendar.year} Academic Year
                        </Badge>
                    </div>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-6 pt-8 space-y-8">
                {/* Hero Header */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                            {calendar.name}
                        </h1>
                        <p className="text-slate-500 text-sm max-w-2xl leading-relaxed italic">
                            {calendar.description || "Manage and track public holidays and corporate events for this calendar year."}
                        </p>
                    </div>

                    {isAdmin && (
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setIsAssignOpen(true)}
                                className="border-slate-200 shadow-sm hover:bg-slate-50"
                            >
                                <Users className="w-4 h-4 mr-2 text-slate-500" />
                                Manage Access
                            </Button>
                            <Button
                                onClick={() => setIsAddHolidayOpen(true)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 border-none"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Holiday
                            </Button>
                        </div>
                    )}
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard icon={<CalendarDays className="text-indigo-600" />} label="Total Holiday Days" value={totalHolidayDays} />
                    <StatCard icon={<Clock className="text-emerald-600" />} label="Upcoming Events" value={holidays.filter(h => isAfter(new Date(h.date), new Date())).length} />
                    <StatCard icon={<Users className="text-amber-600" />} label="Assigned Members" value={members.length} />
                </div>

                {/* Main Content */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            Events Schedule
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                                List View
                            </span>
                        </h2>
                    </div>

                    {holidays.length === 0 ? (
                        <Card className="border-dashed border-2 border-slate-200 shadow-none bg-transparent">
                            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                    <CalendarIcon className="w-10 h-10 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900">No holidays scheduled</h3>
                                <p className="text-slate-500 max-w-xs mt-1">Get started by adding the first holiday or event to this calendar.</p>
                                {isAdmin && (
                                    <Button variant="outline" className="mt-6" onClick={() => setIsAddHolidayOpen(true)}>
                                        Create First Holiday
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="divide-y divide-slate-100">
                                {holidays.map((holiday) => (
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
            </div>

            {/* Modals (Simplified for brevity, maintain logic from original) */}
            <AssignModal
                isOpen={isAssignOpen}
                setIsOpen={setIsAssignOpen}
                members={members}
                selectedMembers={selectedMembers}
                setSelectedMembers={setSelectedMembers}
                onConfirm={() => assignCalendarMutation.mutateAsync({ calendarId: calendar.id, userIds: selectedMembers })}
            />

            {/* Add Holiday Dialog */}
            <Dialog open={isAddHolidayOpen} onOpenChange={setIsAddHolidayOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">Add New Holiday</DialogTitle>
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
                                <Textarea placeholder="Brief details about this holiday..." value={newHoliday.description} onChange={e => setNewHoliday({ ...newHoliday, description: e.target.value })} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button type="button" variant="ghost" onClick={() => setIsAddHolidayOpen(false)}>Cancel</Button>
                            <Button type="submit" className="bg-indigo-600 text-white hover:bg-indigo-700 px-8">Save Holiday</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!holidayToDelete} onOpenChange={(open) => !open && setHolidayToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the holiday <span className="font-semibold text-slate-900">"{holidayToDelete?.name}"</span>.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
                            Delete Holiday
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

/** * Refined Sub-components for Cleanliness
 */

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: number | string }) {
    return (
        <Card className="border-none shadow-sm bg-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-3 opacity-10">{icon}</div>
            <CardContent className="p-6">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
                <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-slate-900 leading-none">{value}</span>
                    <div className="p-1.5 bg-slate-50 rounded-lg">{icon}</div>
                </div>
            </CardContent>
        </Card>
    )
}

function HolidayRow({ holiday, isAdmin, onDelete }: any) {
    const startDate = new Date(holiday.date);
    const endDate = holiday.endDate ? new Date(holiday.endDate) : null;
    const isUpcoming = isAfter(startDate, new Date());
    const duration = endDate ? differenceInCalendarDays(endDate, startDate) + 1 : 1;

    return (
        <div className="group flex flex-col md:flex-row md:items-center justify-between p-5 hover:bg-slate-50 transition-colors gap-4">
            <div className="flex items-start gap-5">
                <div className="relative">
                    <div className="w-14 h-14 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[9px] font-bold uppercase tracking-wider">{format(startDate, 'MMM')}</span>
                        <span className="text-xl font-bold leading-none">{format(startDate, 'd')}</span>
                    </div>
                    {isUpcoming && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                    )}
                </div>

                <div className="space-y-0.5">
                    <div className="flex items-center gap-3">
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                            {holiday.name}
                        </h3>
                        {endDate && (
                            <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-none px-2 py-0.5 text-[10px] font-bold tracking-wide">
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

                    {holiday.description && (
                        <p className="text-sm text-slate-400 leading-relaxed line-clamp-1 max-w-xl pt-0.5">
                            {holiday.description}
                        </p>
                    )}
                </div>
            </div>

            {isAdmin && (
                <div className="flex items-center pl-4 md:pl-0 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        onClick={onDelete}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            )}
        </div>
    )
}

function AssignModal({ isOpen, setIsOpen, members, selectedMembers, setSelectedMembers, onConfirm }: any) {
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="text-xl">Assign Calendar Access</DialogTitle>
                    <DialogDescription>Select the team members who should see these holidays.</DialogDescription>
                </DialogHeader>
                <div className="p-6 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input placeholder="Search members..." className="pl-9 bg-slate-50 border-none" />
                    </div>
                    <div className="space-y-1 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {members.map((member: any) => (
                            <label key={member.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
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
                    <Button onClick={onConfirm} className="w-full bg-indigo-600 hover:bg-indigo-700 h-11 text-white shadow-lg shadow-indigo-100">
                        Update Permissions
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function LoadingSkeleton() {
    return (
        <div className="max-w-[1400px] mx-auto p-8 space-y-8 animate-pulse">
            <div className="h-10 bg-slate-200 rounded-lg w-1/4"></div>
            <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>)}
            </div>
            <div className="grid grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-64 bg-slate-200 rounded-2xl"></div>)}
            </div>
        </div>
    )
}