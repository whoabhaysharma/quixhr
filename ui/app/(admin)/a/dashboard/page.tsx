"use client"

import { useEffect } from "react"
import AdminDashboardView from "@/components/views/admin/AdminDashboardView"
import { useAuth } from "@/context/auth-context"
import { useAdminStats } from "@/lib/hooks/useDashboard"
import { Loader2 } from "lucide-react"

export default function AdminDashboardPage() {
    const { user } = useAuth()
    const organizationId = user?.organization?.id || user?.employee?.organizationId;
    const { data: stats, isLoading, error } = useAdminStats(organizationId)

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

    // Prepare user object for view
    const viewUser = user ? {
        name: user.employee ? `${user.employee.firstName} ${user.employee.lastName}`.trim() : user.user.email,
        email: user.user.email,
        role: user.user.role
    } : undefined

    return (
        <AdminDashboardView
            user={viewUser}
            stats={stats}
            leaves={stats?.pendingLeaveRequests || []}
        />
    )
}
