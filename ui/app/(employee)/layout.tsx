"use client"

import { AppShell, NavGroup } from "@/components/layout/app-shell"
import { LayoutDashboard, Timer, Calendar, CalendarDays } from "lucide-react"

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
    const navGroups: NavGroup[] = [
        {
            title: "General",
            items: [
                { name: "Dashboard", href: "/e/dashboard", icon: LayoutDashboard },
            ]
        },
        {
            title: "My Work",
            items: [
                { name: "Attendance", href: "/e/attendance", icon: Timer, disabled: true, badge: "Coming Soon" },
                { name: "Leaves", href: "/e/leaves", icon: Calendar },
            ]
        },
        {
            title: "Company",
            items: [
                { name: "Holidays", href: "/e/holidays", icon: CalendarDays, disabled: true, badge: "Coming Soon" }
            ]
        }
    ]

    return (
        <AppShell
            navGroups={navGroups}
            allowedRoles={['EMPLOYEE']}
            basePath="/e"
            brand={{ name: "QuixHR", badge: "Me", color: "bg-emerald-600" }}
        >
            {children}
        </AppShell>
    )
}
