"use client"

import { AppShell, NavGroup } from "@/components/layout/app-shell"
import { Users, Clock, Calendar, FileText, LayoutDashboard } from "lucide-react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const navGroups: NavGroup[] = [
        {
            title: "Overview",
            items: [
                { name: "Dashboard", href: "/a/dashboard", icon: LayoutDashboard }
            ]
        },
        {
            title: "Management",
            items: [
                { name: "People", href: "/a/people", icon: Users },
                { name: "Attendance", href: "/a/attendance", icon: Clock },
                { name: "Leave Requests", href: "/a/leaves", icon: Calendar }
            ]
        },
        {
            title: "System",
            items: [
                { name: "Audit Logs", href: "/a/audit", icon: FileText }
            ]
        }
    ]

    return (
        <AppShell
            navGroups={navGroups}
            allowedRoles={['ORG_ADMIN', 'HR_ADMIN', 'MANAGER']}
            basePath="/a"
            brand={{ name: "QuixHR", badge: "Admin", color: "bg-blue-600" }}
        >
            {children}
        </AppShell>
    )
}
