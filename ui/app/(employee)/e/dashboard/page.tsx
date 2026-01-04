"use client"

"use client"

import { useAuth } from "@/context/auth-context"
import { useEmployeeStats } from "@/lib/hooks/useDashboard"
import { useLeaves } from "@/lib/hooks/useLeaves"
import EmployeeDashboardView from "@/components/views/employee/EmployeeDashboardView"
import { Loader2 } from "lucide-react"

export default function EmployeeDashboardPage() {
    const { user } = useAuth()
    const { data: stats, isLoading: statsLoading } = useEmployeeStats()
    const { data: leaves = [], isLoading: leavesLoading } = useLeaves()

    const isLoading = statsLoading || leavesLoading

    if (isLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    // Prepare user object for view
    const viewUser = user ? {
        name: user.employee ? `${user.employee.firstName} ${user.employee.lastName}`.trim() : (user.user.email || 'Employee'),
        role: user.user.role
    } : undefined

    return (
        <EmployeeDashboardView
            user={viewUser}
            stats={stats}
            leaves={leaves}
        />
    )
}
