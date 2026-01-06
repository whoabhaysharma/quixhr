"use client"

import { Building2, Users, CreditCard, TrendingUp } from "lucide-react"
import { StatCard, WelcomeBanner } from "@/components/dashboard/DashboardWidgets"

export default function SuperAdminDashboard() {
    return (
        <div className="space-y-8 max-w-[1600px] mx-auto">
            <WelcomeBanner name="Admin" role="Super Admin" message="Here's what's happening across the platform today." />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    label="Total Companies"
                    value="12"
                    icon={Building2}
                    trend="+2 from last month"
                    trendValue="2"
                    trendUp={true}
                />
                <StatCard
                    label="Active Users"
                    value="+573"
                    icon={Users}
                    trend="+201 since last hour"
                    trendValue="201"
                    trendUp={true}
                />
                <StatCard
                    label="Active Subscriptions"
                    value="+12"
                    icon={CreditCard}
                    trend="+19% from last month"
                    trendValue="19%"
                    trendUp={true}
                />
                <StatCard
                    label="Revenue"
                    value="$45,231.89"
                    icon={TrendingUp}
                    trend="+20.1% from last month"
                    trendValue="20.1%"
                    trendUp={true}
                />
            </div>
        </div>
    )
}
