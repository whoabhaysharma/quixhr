"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Building2, Plus, MoreHorizontal, Loader2, Search, ChevronDown } from "lucide-react"
import { useCompanies, useCreateCompany } from "@/lib/hooks/useSuperAdmin"
import { formatDistanceToNow } from "date-fns"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"

const TIMEZONES = [
    "Asia/Kolkata",
    "America/New_York",
    "Europe/London",
    "Info/UTC",
    "Asia/Dubai",
    "Asia/Singapore",
    "Australia/Sydney"
]

const CURRENCIES = [
    "INR",
    "USD",
    "EUR",
    "GBP",
    "AUD",
    "AED",
    "SGD"
]

const DATE_FORMATS = [
    "DD/MM/YYYY",
    "MM/DD/YYYY",
    "YYYY-MM-DD",
    "DD-MM-YYYY"
]

export default function CompaniesPage() {
    const [search, setSearch] = useState("")
    const [isCreateOpen, setIsCreateOpen] = useState(false)

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        timezone: "Asia/Kolkata",
        currency: "INR",
        dateFormat: "DD/MM/YYYY"
    })

    const { data, isLoading } = useCompanies({ page: 1, limit: 10, search })
    const createCompanyMutation = useCreateCompany()

    const companies = data?.companies || []

    const handleCreate = async () => {
        if (!formData.name.trim()) return

        await createCompanyMutation.mutateAsync(formData)
        setIsCreateOpen(false)
        setFormData({
            name: "",
            timezone: "Asia/Kolkata",
            currency: "INR",
            dateFormat: "DD/MM/YYYY"
        })
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Companies</h2>
                    <p className="text-muted-foreground mt-1">Manage registered organizations.</p>
                </div>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-indigo-600 hover:bg-indigo-700">
                            <Plus className="mr-2 h-4 w-4" /> Add Company
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Create New Company</DialogTitle>
                            <DialogDescription>
                                Add a new organization and configure its default settings.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Company Name</Label>
                                <Input
                                    id="name"
                                    placeholder="Acme Inc."
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Timezone</Label>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" className="w-full justify-between font-normal">
                                                {formData.timezone}
                                                <ChevronDown className="h-4 w-4 opacity-50" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-[180px] max-h-[200px] overflow-y-auto">
                                            {TIMEZONES.map((tz) => (
                                                <DropdownMenuItem
                                                    key={tz}
                                                    onClick={() => setFormData({ ...formData, timezone: tz })}
                                                >
                                                    {tz}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Currency</Label>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" className="w-full justify-between font-normal">
                                                {formData.currency}
                                                <ChevronDown className="h-4 w-4 opacity-50" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-[180px]">
                                            {CURRENCIES.map((curr) => (
                                                <DropdownMenuItem
                                                    key={curr}
                                                    onClick={() => setFormData({ ...formData, currency: curr })}
                                                >
                                                    {curr}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Date Format</Label>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="w-full justify-between font-normal">
                                            {formData.dateFormat}
                                            <ChevronDown className="h-4 w-4 opacity-50" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-full">
                                        {DATE_FORMATS.map((fmt) => (
                                            <DropdownMenuItem
                                                key={fmt}
                                                onClick={() => setFormData({ ...formData, dateFormat: fmt })}
                                            >
                                                {fmt}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreate} disabled={createCompanyMutation.isPending} className="bg-indigo-600">
                                {createCompanyMutation.isPending ? 'Creating...' : 'Create Company'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader className="pb-0">
                    <div className="flex items-center gap-4 py-4 pt-0">
                        <div className="relative flex-1">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search companies..."
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
                    ) : companies.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No companies found.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Company</TableHead>
                                    <TableHead>Employees</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {companies.map((company: any) => (
                                    <TableRow key={company.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center">
                                                    <Building2 className="h-4 w-4 text-slate-500" />
                                                </div>
                                                {company.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>{company._count?.employees || 0}</TableCell>
                                        <TableCell>{formatDistanceToNow(new Date(company.createdAt), { addSuffix: true })}</TableCell>
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
