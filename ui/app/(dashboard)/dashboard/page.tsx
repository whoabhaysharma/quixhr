"use client"

import { useAuth } from "@/context/auth-context"
import { Skeleton } from "@/components/ui/skeleton"
import { useAdminStats, useEmployeeStats } from "@/lib/hooks/useDashboard"
import { useLeaves } from "@/lib/hooks/useLeaves"
import AdminDashboardView from "@/components/views/admin/AdminDashboardView"
import EmployeeDashboardView from "@/components/views/employee/EmployeeDashboardView"

export default function RedesignedDashboard() {
    const { user, isLoading: authLoading } = useAuth()

    // Determine roles for conditional fetching
    const isAdmin = ['HR_ADMIN', 'SUPER_ADMIN', 'MANAGER'].includes(user?.role);
    const isEmployee = user?.role === 'EMPLOYEE';

    // Use TanStack Query hooks based on user role
    const { data: adminStats, isLoading: adminStatsLoading } = useAdminStats(isAdmin)
    const { data: employeeStats, isLoading: employeeStatsLoading } = useEmployeeStats(isEmployee)
    const { data: leaves = [], isLoading: leavesLoading } = useLeaves(
        user?.role === 'EMPLOYEE' ? user.id : undefined
    )

    const dashboardStats = user?.role === 'EMPLOYEE' ? employeeStats : adminStats
    const isLoading = authLoading ||
        (user?.role === 'EMPLOYEE' ? employeeStatsLoading : adminStatsLoading) ||
        leavesLoading

    const recentLeaves = leaves.slice(0, 5)

    if (authLoading || isLoading) return <LoadingSkeleton />

    return (
        <div className="bg-[#f8fafc] min-h-[calc(100vh-4rem)] pb-20">
            <div className="max-w-[1600px] mx-auto px-6 pt-8 space-y-10">
                {['HR_ADMIN', 'SUPER_ADMIN'].includes(user?.role) ? (
                    <AdminDashboardView user={user} stats={dashboardStats} leaves={recentLeaves} />
                ) : user?.role === 'EMPLOYEE' ? (
                    <EmployeeDashboardView user={user} stats={dashboardStats} leaves={recentLeaves} />
                ) : null}
            </div>
        </div>
    )
}

function LoadingSkeleton() {
    return (
        <div className="-m-4 lg:-m-8 bg-[#f8fafc] min-h-[calc(100vh-4rem)] pb-20">
            <div className="max-w-[1400px] mx-auto px-6 pt-8 space-y-10 animate-pulse">
                <header className="flex justify-between items-center">
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-80 rounded-xl" />
                        <Skeleton className="h-4 w-48 rounded-lg" />
                    </div>
                    <Skeleton className="h-10 w-40 rounded-xl" />
                </header>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-3xl" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Skeleton className="lg:col-span-2 h-[500px] rounded-3xl" />
                    <Skeleton className="h-[500px] rounded-3xl" />
                </div>
            </div>
        </div>
    )
}
