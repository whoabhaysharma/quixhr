"use client"

import { AppShell, NavGroup } from "@/components/layout/app-shell"
import { Building2, CreditCard, LayoutDashboard, Settings, Users } from "lucide-react"

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
    const navGroups: NavGroup[] = [
        {
            title: "Overview",
            items: [
                { name: "Dashboard", href: "/s/dashboard", icon: LayoutDashboard }
            ]
        },
        {
            title: "Platform Management",
            items: [
                { name: "Companies", href: "/s/companies", icon: Building2 },
                { name: "Admins", href: "/s/admins", icon: Users }
            ]
        },
        {
            title: "System",
            items: [
                { name: "Settings", href: "/s/settings", icon: Settings }
            ]
        }
    ]

    return (
        <AppShell
            navGroups={navGroups}
            allowedRoles={['SUPER_ADMIN']}
            basePath="/s"
            brand={{ name: "QuixHR", badge: "Admin", color: "bg-indigo-600" }}
        >
            {children}
        </AppShell>
    )
}
