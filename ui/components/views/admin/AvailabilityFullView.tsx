"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Check, CheckCircle2, XCircle, Home, Plane, UserX, AlertCircle, Minus, ChevronLeft, ChevronRight, Search, FileDown, ExternalLink, Calendar as CalendarIcon, Filter, X, Loader2 } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { dashboardService } from "@/lib/services/dashboard"
import { startOfWeek, endOfWeek, format, parseISO, addWeeks, subWeeks } from "date-fns"
import { useState } from "react"
import { useAuth } from "@/context/auth-context"

const StatusCell = ({ status }: { status: string }) => {
    switch (status) {
        case "PRESENT":
            return (
                <div className="h-full w-full flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500/50" />
                </div>
            )
        case "ABSENT":
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

export default function AvailabilityFullView() {
    const { user } = useAuth();
    const organizationId = user?.organization?.id || user?.employee?.organizationId;
    const [currentDate, setCurrentDate] = useState(new Date());

    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });

    const { data: availabilityData, isLoading } = useQuery({
        queryKey: ['dashboard-availability', organizationId, start.toISOString()],
        queryFn: () => {
            if (!organizationId) return Promise.reject("No Org ID");
            return dashboardService.getAvailability(organizationId, start.toISOString(), end.toISOString())
        },
        enabled: !!organizationId
    });

    const handlePreviousWeek = () => setCurrentDate(subWeeks(currentDate, 1));
    const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));

    if (isLoading) {
        return <div className="h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>;
    }

    const { dates, employees } = availabilityData || { dates: [], employees: [] };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">People Availability</h1>
                    <p className="text-slate-500">Manage and view organization-wide attendance for the week.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2 hidden sm:flex">
                        <FileDown className="h-4 w-4" />
                        Export
                    </Button>
                </div>
            </div>

            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-4 border-b border-slate-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4 bg-slate-50 p-1 rounded-lg border border-slate-200">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white hover:shadow-sm" onClick={handlePreviousWeek}>
                                <ChevronLeft className="h-4 w-4 text-slate-600" />
                            </Button>
                            <span className="text-sm font-semibold text-slate-700 min-w-[140px] text-center flex items-center justify-center gap-2">
                                <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
                                {format(start, 'MMM dd')} - {format(end, 'MMM dd')}
                            </span>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white hover:shadow-sm" onClick={handleNextWeek}>
                                <ChevronRight className="h-4 w-4 text-slate-600" />
                            </Button>
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search employees..."
                                    className="pl-9 h-9 border-slate-200 focus-visible:ring-emerald-500"
                                />
                            </div>
                            <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
                                <Filter className="h-4 w-4 text-slate-500" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px] border-separate border-spacing-0">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="text-left font-semibold text-xs text-slate-500 uppercase tracking-wider py-4 px-6 border-b border-slate-100 sticky left-0 bg-slate-50/95 z-10 w-[250px]">Employee</th>
                                    {dates?.map((day) => {
                                        const d = parseISO(day.date);
                                        const isToday = format(d, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                                        return (
                                            <th key={day.date} className="text-center border-b border-slate-100 py-4 px-2">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[10px] uppercase font-bold text-slate-400">{day.dayName}</span>
                                                    <span className={`text-sm font-bold mt-1 ${isToday ? "text-indigo-600 bg-indigo-50 h-6 w-6 flex items-center justify-center rounded" : "text-slate-700"}`}>
                                                        {format(d, 'dd')}
                                                    </span>
                                                </div>
                                            </th>
                                        )
                                    })}
                                    <th className="text-center font-semibold text-xs text-slate-500 uppercase tracking-wider py-4 px-4 border-b border-slate-100 w-[100px]">Stats</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {employees?.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="text-center py-8 text-slate-500">No employees found.</td>
                                    </tr>
                                ) : employees?.map((employee) => {
                                    const absentCount = employee.availability.filter(s => s === "ABSENT").length;
                                    return (
                                        <tr key={employee.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="py-3 px-6 sticky left-0 bg-white group-hover:bg-slate-50/50 transition-colors z-10 border-r border-transparent group-hover:border-slate-100">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9 border border-slate-100">
                                                        <AvatarImage src={employee.avatar} />
                                                        <AvatarFallback className="bg-slate-100 text-slate-600 font-bold text-xs">
                                                            {employee.name.charAt(0)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-slate-900 truncate">{employee.name}</p>
                                                        <p className="text-xs text-slate-500 truncate flex items-center gap-1.5">
                                                            {employee.role}
                                                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                            {employee.dept}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            {employee.availability.map((status, index) => (
                                                <td key={index} className="p-2 h-16 w-16 text-center">
                                                    <div className="h-10 w-10 mx-auto flex items-center justify-center">
                                                        <TooltipProvider delayDuration={0}>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <div className="cursor-default h-full w-full flex items-center justify-center">
                                                                        <StatusCell status={status} />
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent className="text-xs font-medium">
                                                                    <p>{StatusTooltip({ status })}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </div>
                                                </td>
                                            ))}
                                            <td className="p-2 text-center">
                                                {absentCount > 0 ? (
                                                    <Badge variant="secondary" className="bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-100 font-medium">
                                                        {absentCount} Absent
                                                    </Badge>
                                                ) : (
                                                    <span className="text-xs text-slate-400 font-medium">100%</span>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
