"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Shield } from "lucide-react"

export default function AdminsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">System Administrators</h2>
                    <p className="text-muted-foreground mt-1">Manage users with Super Admin privileges.</p>
                </div>
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="mr-2 h-4 w-4" /> Invite Admin
                </Button>
            </div>

            <div className="grid gap-4">
                {[1, 2].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white rounded-xl border">
                        <div className="flex items-center gap-4">
                            <Avatar>
                                <AvatarFallback className="bg-indigo-100 text-indigo-700">SA</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium text-sm">Super Admin {i}</p>
                                <p className="text-xs text-muted-foreground">admin{i}@quixhr.com</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full flex items-center gap-1">
                                <Shield className="w-3 h-3" /> Root Access
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
