"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Check, CheckCircle2, XCircle, Home, Plane, UserX, AlertCircle, Minus, ArrowRight, X } from "lucide-react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { dashboardService } from "@/lib/services/dashboard"
import { startOfWeek, endOfWeek, format, parseISO } from "date-fns"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/context/auth-context"

const StatusCell = ({ status }: { status: string }) => {
    switch (status) {
        case "PRESENT":
            // Subtle check for present
            return (
                <div className="h-full w-full flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500/50" />
                </div>
            )
        case "ABSENT":
            // Bold Red X for Absent
            return (
                <div className="h-full w-full bg-rose-50 rounded-md flex items-center justify-center border border-rose-100">
                    <X className="h-4 w-4 text-rose-600 font-bold" />
                </div>
            )
        case "OFF":
            return (
                <div className="h-full w-full flex items-center justify-center">
                    <Minus className="h-3 w-3 text-slate-200" />
                </div>
            )
        default:
            return <div className="h-1.5 w-1.5 rounded-full bg-slate-200" />
    }
}

const StatusTooltip = ({ status }: { status: string }) => {
    switch (status) {
        case "PRESENT": return "Present"
        case "ABSENT": return "Absent"
        case "OFF": return "Weekly Off"
        default: return "Unknown"
    }
}

export function AvailabilityWeekView() {
    const { user } = useAuth();
    const organizationId = user?.organization?.id || user?.employee?.organizationId;

    // Current Week
    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn: 1 });
    const end = endOfWeek(now, { weekStartsOn: 1 });

    const { data, isLoading } = useQuery({
        queryKey: ['dashboard-availability', organizationId, start.toISOString()],
        queryFn: () => {
            if (!organizationId) return Promise.reject("No Org ID");
            return dashboardService.getAvailability(organizationId, start.toISOString(), end.toISOString())
        },
        enabled: !!organizationId
    });

    if (isLoading) {
        return (
            <Card className="col-span-full xl:col-span-2 border-slate-200 shadow-sm min-h-[300px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </Card>
        )
    }

    const { dates, employees } = data || { dates: [], employees: [] };
    // Limit to 5 for Widget
    const widgetEmployees = employees?.slice(0, 5) || [];

    return (
        <Card className="col-span-full xl:col-span-2 border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="space-y-1">
                    <CardTitle className="text-base font-semibold text-slate-900">People Availability</CardTitle>
                    <p className="text-sm text-slate-500">Upcoming absences this week</p>
                </div>
                <Link href="/a/people/availability">
                    <Button variant="ghost" size="sm" className="text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-medium h-8">
                        View Full Schedule <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                </Link>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px] border-separate border-spacing-1">
                        <thead>
                            <tr>
                                <th className="text-left font-medium text-xs text-slate-500 uppercase tracking-wider pb-2 w-[200px] pl-2">Employee</th>
                                {dates?.map((day) => {
                                    const d = parseISO(day.date);
                                    const isToday = format(d, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                                    return (
                                        <th key={day.date} className="pb-2">
                                            <div className="flex flex-col items-center">
                                                <span className="text-[10px] uppercase font-bold text-slate-400">{day.dayName}</span>
                                                <span className={`text-[10px] font-bold mt-0.5 ${isToday ? "text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded" : "text-slate-600"}`}>
                                                    {format(d, 'dd')}
                                                </span>
                                            </div>
                                        </th>
                                    )
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {widgetEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-6 text-sm text-slate-500">
                                        No active employees found.
                                    </td>
                                </tr>
                            ) : widgetEmployees.map((employee) => (
                                <tr key={employee.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="py-2 pr-4 rounded-lg">
                                        <div className="flex items-center gap-3 pl-2">
                                            <Avatar className="h-8 w-8 text-[10px] border border-slate-100">
                                                <AvatarImage src={employee.avatar} />
                                                <AvatarFallback className="bg-slate-50 text-slate-600 font-bold">
                                                    {employee.name.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-slate-900 truncate">{employee.name}</p>
                                                <p className="text-[10px] text-slate-500 truncate">{employee.role}</p>
                                            </div>
                                        </div>
                                    </td>
                                    {employee.availability.map((dayStatus, index) => (
                                        <td key={index} className="h-10 w-14">
                                            <TooltipProvider delayDuration={0}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="h-full w-full cursor-default">
                                                            <StatusCell status={dayStatus.status} />
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="text-xs font-medium">
                                                        <p>{StatusTooltip({ status: dayStatus.status })}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    )
}
