"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Loader2, Search, ShieldCheck, Mail, MoreHorizontal } from "lucide-react"
import { useAdmins } from "@/lib/hooks/useSuperAdmin"
import { formatDistanceToNow } from "date-fns"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"

export default function AdminsPage() {
    const [search, setSearch] = useState("")

    const { data, isLoading } = useAdmins({ page: 1, limit: 10, search })

    const admins = data?.users || []

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">System Admins</h2>
                <p className="text-muted-foreground mt-1">Manage platform administrators.</p>
            </div>

            <Card>
                <CardHeader className="pb-0">
                    <div className="flex items-center gap-4 py-4 pt-0">
                        <div className="relative flex-1">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search admins..."
                                className="pl-8 max-w-sm"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                        </div>
                    ) : admins.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No system admins found.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Admin</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Last Active</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {admins.map((admin: any) => (
                                    <TableRow key={admin.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded bg-indigo-100 flex items-center justify-center text-indigo-600">
                                                    <ShieldCheck className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <div className="font-medium">
                                                        {admin.employee?.firstName} {admin.employee?.lastName}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-3 w-3 text-muted-foreground" />
                                                {admin.email}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${admin.isEmailVerified
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-yellow-100 text-yellow-700"
                                                }`}>
                                                {admin.isEmailVerified ? "Verified" : "Pending"}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {admin.auditLogs?.[0]?.createdAt
                                                ? formatDistanceToNow(new Date(admin.auditLogs[0].createdAt), { addSuffix: true })
                                                : "Never"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
