"use client"

import { AppShell, NavGroup } from "@/components/layout/app-shell"
import { LayoutDashboard, Timer, Calendar, CalendarDays } from "lucide-react"

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
    const navGroups: NavGroup[] = [
        {
            items: [
                { name: "Overview", href: "/e/dashboard", icon: LayoutDashboard },
                { name: "Attendance", href: "/e/attendance", icon: Timer },
                { name: "Time Off", href: "/e/leaves", icon: Calendar },
                { name: "Holidays", href: "/e/holidays", icon: CalendarDays }
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
