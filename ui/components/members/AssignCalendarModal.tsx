
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useQuery } from "@tanstack/react-query"
import { calendarService } from "@/lib/services/calendar"
import { useAssignCalendar } from "@/lib/hooks/useMembers"
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react"

interface AssignCalendarModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    memberId: string | null
    memberName?: string
    onSuccess?: () => void
}

export function AssignCalendarModal({ open, onOpenChange, memberId, memberName, onSuccess }: AssignCalendarModalProps) {
    const [selectedCalendarId, setSelectedCalendarId] = useState<string>("")

    // Fetch calendars
    const { data: calendarsResponse, isLoading: isLoadingCalendars } = useQuery({
        queryKey: ['calendars'],
        queryFn: () => calendarService.getCalendars(),
        enabled: open // Only fetch when modal is open
    })

    const calendars = calendarsResponse?.data || []
    const selectedCalendar = calendars.find((c: any) => c.id === selectedCalendarId)

    const assignCalendarMutation = useAssignCalendar()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!memberId || !selectedCalendarId) return

        try {
            await assignCalendarMutation.mutateAsync({
                memberId,
                calendarId: selectedCalendarId
            })
            onOpenChange(false)
            if (onSuccess) onSuccess()
            setSelectedCalendarId("")
        } catch (error) {
            // Error handling done in mutation
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Assign Holiday Calendar</DialogTitle>
                    <DialogDescription>
                        Select a holiday calendar to assign to <span className="font-semibold text-slate-900">{memberName || 'this member'}</span>. The member will follow this calendar's holiday schedule.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-2">
                    <div className="space-y-2">
                        <label htmlFor="calendar" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Select Calendar
                        </label>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    className="w-full justify-between font-normal"
                                    disabled={isLoadingCalendars}
                                >
                                    {selectedCalendar ? (
                                        <div className="flex items-center">
                                            <CalendarIcon className="w-3.5 h-3.5 mr-2 text-slate-500" />
                                            <span>{selectedCalendar.name} ({selectedCalendar.year})</span>
                                        </div>
                                    ) : (
                                        <span className="text-slate-500">
                                            {isLoadingCalendars ? "Loading calendars..." : "Select a calendar"}
                                        </span>
                                    )}
                                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[var(--radix-popper-anchor-width)]" align="start">
                                {calendars.length === 0 ? (
                                    <div className="p-2 text-sm text-slate-500 text-center">No calendars available</div>
                                ) : (
                                    calendars.map((cal: any) => (
                                        <DropdownMenuItem
                                            key={cal.id}
                                            onSelect={() => setSelectedCalendarId(cal.id)}
                                            className="cursor-pointer"
                                        >
                                            <div className="flex items-center">
                                                <CalendarIcon className="w-3.5 h-3.5 mr-2 text-slate-500" />
                                                <span>{cal.name} ({cal.year})</span>
                                            </div>
                                        </DropdownMenuItem>
                                    ))
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={!selectedCalendarId || assignCalendarMutation.isPending}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            {assignCalendarMutation.isPending ? "Assigning..." : "Assign Calendar"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
