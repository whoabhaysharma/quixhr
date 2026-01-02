"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, Plus, MoreHorizontal } from "lucide-react"

export default function CompaniesPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Companies</h2>
                    <p className="text-muted-foreground mt-1">Manage registered organizations and their status.</p>
                </div>
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="mr-2 h-4 w-4" /> Add Company
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Acme Corp {i}</CardTitle>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center">
                                    <Building2 className="h-6 w-6 text-slate-500" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">128</div>
                                    <p className="text-xs text-muted-foreground">Active Employees</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground mt-4 pt-4 border-t">
                                <span>Plan: Enterprise</span>
                                <span className="text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">Active</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
