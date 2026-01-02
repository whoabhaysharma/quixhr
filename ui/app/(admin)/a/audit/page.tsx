"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { auditService, AuditLog } from "@/services/audit";
import { useAuth } from "@/context/auth-context";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Filter, X } from "lucide-react";

// Predefined filter options based on backend enums/events
const ACTION_OPTIONS = [
    { label: "Create", value: "CREATE" },
    { label: "Update", value: "UPDATE" },
    { label: "Delete", value: "DELETE" },
    { label: "Login", value: "LOGIN" },
    { label: "Register", value: "REGISTER" },
];

const RESOURCE_OPTIONS = [
    { label: "Auth", value: "AUTH" },
    { label: "Employee", value: "EMPLOYEE" },
    { label: "Attendance", value: "ATTENDANCE" },
    { label: "Company", value: "COMPANY" },
    { label: "Calendar", value: "CALENDAR" },
    { label: "Leave", value: "LEAVE" },
    { label: "Notification", value: "NOTIFICATION" },
];

export default function AuditLogsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [userId, setUserId] = useState("");
    const [action, setAction] = useState("");
    const [resource, setResource] = useState("");

    // Pagination
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const LIMIT = 20;

    useEffect(() => {
        if (!authLoading) {
            if (!user || (user.role !== "HR_ADMIN" && user.role !== "SUPER_ADMIN" && user.role !== "MANAGER")) {
                router.push("/a/dashboard");
            } else {
                fetchLogs();
            }
        }
    }, [user, authLoading, page]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const data = await auditService.getLogs({
                page,
                limit: LIMIT,
                userId: userId || undefined,
                action: action || undefined,
                resource: resource || undefined,
            });
            setLogs(data.logs);
            setTotal(data.total);
        } catch (error) {
            console.error("Failed to fetch audit logs", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilter = () => {
        setPage(1);
        fetchLogs();
    };

    const clearFilters = () => {
        setUserId("");
        setAction("");
        setResource("");
        setPage(1);
        setTimeout(() => fetchLogs(), 0);
    };

    const getActionColor = (act: string) => {
        if (act.includes("CREATE") || act.includes("REGISTER") || act.includes("ADD")) return "default"; // dark/black
        if (act.includes("UPDATE") || act.includes("EDIT")) return "secondary"; // gray
        if (act.includes("DELETE") || act.includes("REMOVE")) return "destructive"; // red
        return "outline";
    };

    if (authLoading) return (
        <div className="h-screen w-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Audit Logs</h1>
                    <p className="text-slate-500 mt-1">Track system activities and security events.</p>
                </div>
            </div>

            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-100">
                    <CardTitle className="text-lg font-medium flex items-center gap-2">
                        <Filter className="w-4 h-4 text-slate-500" />
                        Filter Logs
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="flex flex-wrap items-center gap-3">
                        {/* User ID Search */}
                        <div className="relative">
                            <Input
                                placeholder="Search by User ID..."
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                className="w-[240px] h-9 text-sm"
                            />
                        </div>

                        {/* Action Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-9 border-dashed">
                                    {action ? `Action: ${action}` : "Select Action"}
                                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-[200px]">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setAction("")}>
                                    All Actions
                                </DropdownMenuItem>
                                {ACTION_OPTIONS.map((opt) => (
                                    <DropdownMenuItem
                                        key={opt.value}
                                        onClick={() => setAction(opt.value)}
                                        className="cursor-pointer"
                                    >
                                        {opt.label}
                                        {action === opt.value && <span className="ml-auto text-indigo-600 font-bold">✓</span>}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Resource Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-9 border-dashed">
                                    {resource ? `Resource: ${resource}` : "Select Resource"}
                                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-[200px]">
                                <DropdownMenuLabel>Resources</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setResource("")}>
                                    All Resources
                                </DropdownMenuItem>
                                {RESOURCE_OPTIONS.map((opt) => (
                                    <DropdownMenuItem
                                        key={opt.value}
                                        onClick={() => setResource(opt.value)}
                                        className="cursor-pointer"
                                    >
                                        {opt.label}
                                        {resource === opt.value && <span className="ml-auto text-indigo-600 font-bold">✓</span>}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <div className="ml-auto flex items-center gap-2">
                            {(userId || action || resource) && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="h-9 px-2 lg:px-3 text-slate-500 hover:text-slate-900"
                                >
                                    <X className="mr-2 h-4 w-4" />
                                    Reset
                                </Button>
                            )}
                            <Button size="sm" onClick={handleFilter} className="h-9 bg-indigo-600 hover:bg-indigo-700 text-white">
                                Apply Filters
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="w-[180px]">Timestamp</TableHead>
                                <TableHead className="w-[200px]">User</TableHead>
                                <TableHead className="w-[120px]">Action</TableHead>
                                <TableHead className="w-[150px]">Resource</TableHead>
                                <TableHead className="w-[300px]">Details</TableHead>
                                <TableHead className="w-[120px] text-right">IP Address</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-32 text-slate-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                                            Loading audit logs...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-32 text-slate-500">
                                        No audit logs found matching your criteria.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log) => (
                                    <TableRow key={log.id} className="hover:bg-slate-50/50">
                                        <TableCell className="text-xs text-slate-500 font-medium">
                                            <div className="flex flex-col" title={format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")}>
                                                <span className="text-slate-900 font-semibold">
                                                    {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                                                </span>
                                                <span className="text-[10px] text-slate-400">
                                                    {format(new Date(log.createdAt), "MMM d, HH:mm")}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                {log.user ? (
                                                    <>
                                                        <span className="text-sm font-medium text-slate-900">
                                                            {log.user.employee?.name || "System User"}
                                                        </span>
                                                        <span className="text-xs text-slate-500">{log.user.email}</span>
                                                    </>
                                                ) : (
                                                    <span className="text-xs font-mono text-slate-400 truncate max-w-[150px]" title={log.userId}>
                                                        {log.userId}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getActionColor(log.action) as "default" | "secondary" | "destructive" | "outline"} className="font-bold text-[10px]">
                                                {log.action}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm text-slate-700">{log.resource}</span>
                                                <span className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]" title={log.resourceId}>
                                                    ID: {log.resourceId}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-xs font-mono text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 max-h-[60px] overflow-y-auto">
                                                {log.details ? JSON.stringify(log.details, null, 1) : '-'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right text-xs text-slate-400 font-mono">
                                            {log.ipAddress === "::1" || log.ipAddress === "127.0.0.1" ? "Localhost" : log.ipAddress || '-'}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            <div className="flex justify-between items-center px-2">
                <div className="text-sm text-slate-500">
                    Showing <span className="font-medium text-slate-900">{((page - 1) * LIMIT) + 1}</span> to <span className="font-medium text-slate-900">{Math.min(page * LIMIT, total)}</span> of <span className="font-medium text-slate-900">{total}</span> entries
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="h-8"
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page * LIMIT >= total}
                        onClick={() => setPage(p => p + 1)}
                        className="h-8"
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}
