"use client"

import { useEffect } from "react"
import AdminDashboardView from "@/components/views/admin/AdminDashboardView"
import { useAuth } from "@/lib/hooks/useAuth"
import { useAdminStats } from "@/lib/hooks/useDashboard"
import { Loader2 } from "lucide-react"

export default function AdminDashboardPage() {
    const { user } = useAuth()
    const { data: stats, isLoading, error } = useAdminStats()

    if (isLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-8 text-center bg-red-50 text-red-600 rounded-lg">
                <p>Failed to load dashboard data. Please try again later.</p>
            </div>
        )
    }

    return (
        <AdminDashboardView
            user={user}
            stats={stats}
            leaves={stats?.pendingLeaveRequests || []}
        />
    )
}
