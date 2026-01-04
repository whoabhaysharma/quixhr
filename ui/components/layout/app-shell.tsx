"use client"

import { useAuth } from "@/context/auth-context"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
    Menu,
    LogOut,
    Bell,
    ChevronDown,
    User,
    Settings,
    Search,
    Plus
} from "lucide-react"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatRole } from "@/lib/utils/formatters"
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead } from "@/lib/hooks/useNotifications"
import { formatDistanceToNow } from "date-fns"

export interface NavItem {
    name: string
    href: string
    icon: any
    badge?: number | string
    disabled?: boolean
}

export interface NavGroup {
    title?: string
    items: NavItem[]
}

interface AppShellProps {
    children: React.ReactNode
    navGroups: NavGroup[]
    allowedRoles: string[]
    basePath: string // e.g. /admin, /employee
    onRedirect?: () => void // Custom redirect logic if needed
    brand?: {
        name: string
        badge?: string
        color?: string
    }
}

export function AppShell({
    children,
    navGroups,
    allowedRoles,
    basePath,
    brand = { name: "QuixHR", color: "bg-blue-600" }
}: AppShellProps) {
    const { isAuthenticated, isLoading, logout, user } = useAuth()
    const router = useRouter()
    const pathname = usePathname()
    const [isSidebarOpen, setSidebarOpen] = useState(false)

    // Notification hooks
    const { data: notificationsData } = useNotifications(10, 0)
    const { data: unreadCountData } = useUnreadCount()
    const markAsReadMutation = useMarkAsRead()
    const markAllAsReadMutation = useMarkAllAsRead()

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                router.push('/login')
                return
            }

            // Role-based access control
            // If allowedRoles contains '*', allow any authenticated user
            if (!allowedRoles.includes('*') && user?.user?.role && !allowedRoles.includes(user.user.role)) {
                // If user is accessing /admin but is EMPLOYEE, kick them out
                // If user is accessing /employee but is SUPER_ADMIN, kick them out? 
                // Let's rely on the passed redirect logic or default to a safe dashboard

                // Defaults:
                if (user.user.role === 'SUPER_ADMIN') router.push('/s/dashboard')
                else if (['ORG_ADMIN', 'HR_ADMIN'].includes(user.user.role)) router.push('/a/dashboard')
                else router.push('/e/dashboard')
            }
        }
    }, [isAuthenticated, isLoading, router, user, allowedRoles])

    if (isLoading || !isAuthenticated) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-[#F8FAFC]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-slate-600">Loading...</p>
                </div>
            </div>
        )
    }

    // Role Guard Check (Render nothing while redirecting)
    if (!allowedRoles.includes('*') && user?.user?.role && !allowedRoles.includes(user.user.role)) {
        return null
    }

    const notifications = notificationsData?.data || []
    const unreadCount = unreadCountData?.data?.count || 0

    const handleMarkAsRead = (notificationId: string) => {
        markAsReadMutation.mutate(notificationId)
    }

    const handleMarkAllAsRead = () => {
        markAllAsReadMutation.mutate()
    }

    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'SUCCESS': return 'text-green-600'
            case 'WARNING': return 'text-amber-600'
            case 'ERROR': return 'text-red-600'
            default: return 'text-blue-600'
        }
    }

    return (
        <div className="h-screen w-full bg-[#F8FAFC] flex font-sans text-neutral-900 overflow-hidden">
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar Navigation */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-50
                w-[280px] bg-white border-r border-slate-200
                transform transition-transform duration-300 ease-in-out
                flex flex-col h-full shrink-0
                ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
            `}>
                {/* Brand */}
                <div className="h-20 flex items-center px-8 border-b border-slate-200 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center shadow-md">
                            <span className="text-white font-[800] text-2xl font-[family-name:var(--font-lexend)] leading-none flex items-center justify-center">
                                Q
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-bold tracking-tight text-slate-900 leading-none">{brand.name}</span>
                            {brand.badge && <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{brand.badge}</span>}
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
                    {navGroups.map((group, groupIdx) => (
                        <div key={groupIdx}>
                            {group.title && (
                                <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    {group.title}
                                </p>
                            )}
                            <div className="space-y-1">
                                {group.items.map((item) => {
                                    const isActive = pathname.startsWith(item.href)
                                    const Icon = item.icon
                                    const isDisabled = item.disabled

                                    if (isDisabled) {
                                        return (
                                            <div
                                                key={item.href}
                                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 cursor-not-allowed opacity-60"
                                            >
                                                <Icon className="w-5 h-5 text-slate-400" />
                                                <span className="flex-1">{item.name}</span>
                                                {item.badge && (
                                                    <span className="bg-slate-100 text-slate-500 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </div>
                                        )
                                    }

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setSidebarOpen(false)}
                                            className={`
                                                flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group
                                                ${isActive
                                                    ? `bg-slate-800 text-white shadow-md`
                                                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                                }
                                            `}
                                        >
                                            <Icon className={`w-5 h-5 transition-colors ${isActive ? "text-white" : "text-slate-500 group-hover:text-slate-900"}`} />
                                            <span className="flex-1">{item.name}</span>
                                            {item.badge && (
                                                <span className={`${typeof item.badge === 'string' ? "bg-indigo-100 text-indigo-700 border border-indigo-200" : "bg-indigo-600 text-white"} text-[10px] px-2 py-0.5 rounded-full font-bold`}>
                                                    {item.badge}
                                                </span>
                                            )}
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Mobile Logout */}
                <div className="p-4 border-t border-slate-200 lg:hidden shrink-0">
                    <Button
                        onClick={logout}
                        variant="ghost"
                        className="w-full justify-start text-slate-600 hover:text-slate-900 hover:bg-slate-100 gap-2"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </Button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
                {/* Header */}
                <header className="sticky top-0 z-40 h-16 w-full border-b border-slate-200/60 bg-white/80 backdrop-blur-xl shrink-0 transition-all duration-300">
                    <div className="flex h-full items-center justify-between px-4 lg:px-8 max-w-[1600px] mx-auto">

                        {/* Mobile Menu & Title */}
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="lg:hidden h-10 w-10 text-slate-500 hover:bg-slate-100 rounded-full"
                                onClick={() => setSidebarOpen(true)}
                            >
                                <Menu className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Right Area (Profile, Notifs) */}
                        <div className="flex items-center gap-3 ml-auto">
                            {/* Notifications */}
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon" className="relative w-9 h-9 rounded-full text-slate-500 hover:text-slate-900 transition-colors">
                                        <Bell className="w-5 h-5" />
                                        {unreadCount > 0 && (
                                            <span className="absolute top-2 right-2 flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-800"></span>
                                            </span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-96 mt-2 p-0 rounded-2xl shadow-2xl border-slate-200" align="end">
                                    <div className="p-4 bg-slate-50/50 rounded-t-2xl border-b border-slate-100 flex items-center justify-between">
                                        <h4 className="font-bold text-xs uppercase tracking-widest text-slate-500">Notifications</h4>
                                        {notifications.length > 0 && (
                                            <button onClick={handleMarkAllAsRead} className="text-[10px] text-slate-900 font-bold hover:underline">Mark all read</button>
                                        )}
                                    </div>
                                    <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                                        {notifications.length === 0 ? (
                                            <div className="p-8 text-center text-slate-400 text-sm">No notifications</div>
                                        ) : (
                                            notifications.map((n: any) => (
                                                <div key={n.id} className={`p-4 hover:bg-slate-50 cursor-pointer ${!n.isRead ? 'bg-indigo-50/30' : ''}`} onClick={() => !n.isRead && handleMarkAsRead(n.id)}>
                                                    <p className={`text-sm font-semibold ${getNotificationColor(n.type)}`}>{n.title}</p>
                                                    <p className="text-xs text-slate-600 mt-1">{n.message}</p>
                                                    <p className="text-[10px] text-slate-400 mt-2">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </PopoverContent>
                            </Popover>

                            {/* Profile */}
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button className="flex items-center gap-2 group p-0.5 pr-3 rounded-full hover:bg-slate-100/80 transition-all outline-none">
                                        <Avatar className="h-9 w-9 border-2 border-white shadow-sm ring-1 ring-slate-200">
                                            <AvatarFallback className="bg-slate-800 text-white font-black text-xs">
                                                {user?.employee?.firstName?.charAt(0) || user?.user?.email?.charAt(0) || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="hidden text-left lg:block">
                                            <p className="text-sm font-bold text-slate-900 leading-tight">
                                                {user?.employee?.firstName || 'User'}
                                            </p>
                                            <p className="text-[11px] text-slate-600 font-medium leading-tight mt-0.5">
                                                {user?.user?.role ? formatRole(user.user.role) : 'Employee'}
                                            </p>
                                        </div>
                                        <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-900 transition-colors" />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent align="end" className="w-60 p-0 rounded-2xl shadow-2xl border-slate-200" sideOffset={8}>
                                    <div className="px-4 py-3 bg-slate-50/50 rounded-t-2xl border-b border-slate-100">
                                        <p className="text-sm font-bold text-slate-900 leading-tight">
                                            {user?.employee?.firstName && user?.employee?.lastName
                                                ? `${user.employee.firstName} ${user.employee.lastName}`
                                                : user?.employee?.firstName || 'User'}
                                        </p>
                                        <p className="text-xs text-slate-600 mt-1 leading-tight">
                                            {user?.user?.role ? formatRole(user.user.role) : 'Employee'}
                                        </p>
                                        <p className="text-xs text-slate-500 truncate mt-1">
                                            {user?.user?.email}
                                        </p>
                                    </div>
                                    <div className="p-1.5">
                                        <Button variant="ghost" className="w-full justify-start h-9 px-3 text-sm font-medium text-slate-700">
                                            <User className="w-4 h-4 mr-2" /> Profile
                                        </Button>
                                        <Button variant="ghost" className="w-full justify-start h-9 px-3 text-sm font-medium text-slate-700">
                                            <Settings className="w-4 h-4 mr-2" /> Preferences
                                        </Button>
                                        <div className="h-px bg-slate-100 my-1"></div>
                                        <Button onClick={logout} variant="ghost" className="w-full justify-start h-9 px-3 text-sm font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50">
                                            <LogOut className="w-4 h-4 mr-2" /> Sign Out
                                        </Button>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </header>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
                    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto w-full min-h-full">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    )
}
