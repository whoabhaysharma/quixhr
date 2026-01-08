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
    Check,
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

    const notifications = notificationsData?.data?.data || []
    const unreadCount = unreadCountData?.data?.unreadCount || 0

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
                        <div className="flex flex-col min-w-0">
                            <span className="text-xl font-bold tracking-tight text-slate-900 leading-none">{brand.name}</span>
                            <div className="flex items-center gap-1.5 mt-1">
                                {brand.badge && <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{brand.badge}</span>}
                                {user?.organization?.name && (
                                    <>
                                        <span className="text-[10px] text-slate-300">•</span>
                                        <span className="text-[10px] font-medium text-slate-600 truncate max-w-[100px]" title={user.organization.name}>
                                            {user.organization.name}
                                        </span>
                                    </>
                                )}
                            </div>
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
                                    <Button variant="ghost" size="icon" className="relative w-10 h-10 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200">
                                        <Bell className="w-5 h-5 stroke-[1.5px]" />
                                        {unreadCount > 0 && (
                                            <span className="absolute top-1.5 right-1.5 flex items-center justify-center h-4 w-4 rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white">
                                                {unreadCount > 9 ? '9+' : unreadCount}
                                            </span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[380px] mt-2 p-0 rounded-2xl shadow-xl border-slate-100/60 ring-1 ring-slate-900/5 overflow-hidden" align="end" sideOffset={8}>
                                    <div className="px-5 py-4 bg-white/50 backdrop-blur-xl border-b border-slate-50 flex items-center justify-between sticky top-0 z-10">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-sm text-slate-800">Notifications</h4>
                                            {unreadCount > 0 && (
                                                <span className="bg-rose-50 text-rose-600 text-[10px] px-2 py-0.5 rounded-full font-bold border border-rose-100">
                                                    {unreadCount} new
                                                </span>
                                            )}
                                        </div>
                                        {notifications.length > 0 && (
                                            <button
                                                onClick={handleMarkAllAsRead}
                                                className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
                                            >
                                                Mark all as read
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-[450px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                                        {notifications.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                                                    <Bell className="w-6 h-6 text-slate-300" />
                                                </div>
                                                <p className="text-sm font-medium text-slate-900">No notifications</p>
                                                <p className="text-xs text-slate-500 mt-1 max-w-[200px]">We'll notify you when something important happens.</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-slate-50">
                                                {notifications.map((n: any) => (
                                                    <div
                                                        key={n.id}
                                                        className={`
                                                            group relative px-6 py-5 hover:bg-slate-50 transition-all duration-200
                                                            ${!n.isRead ? 'bg-white' : 'bg-slate-50/30'}
                                                        `}
                                                    >
                                                        {/* Unread Indicator Ligne */}
                                                        {!n.isRead && (
                                                            <div className="absolute left-0 top-5 bottom-5 w-1 rounded-r-lg bg-indigo-500" />
                                                        )}

                                                        <div className="flex gap-4 items-start">
                                                            <div className="flex-1 min-w-0 space-y-1.5">
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <p className={`text-sm font-medium leading-snug ${!n.isRead ? 'text-slate-900' : 'text-slate-600'}`}>
                                                                        {n.title}
                                                                    </p>
                                                                    {!n.isRead && (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleMarkAsRead(n.id);
                                                                            }}
                                                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-indigo-600 -mr-2 -mt-1"
                                                                            title="Mark as read"
                                                                        >
                                                                            <span className="sr-only">Mark as read</span>
                                                                            <div className="w-4 h-4 border-2 border-current rounded-full flex items-center justify-center">
                                                                                <div className="w-2 h-2 rounded-full bg-current opacity-0 hover:opacity-100" />
                                                                            </div>
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 pr-4">
                                                                    {n.message}
                                                                </p>
                                                                <p className="text-[10px] font-medium text-slate-400 flex items-center gap-1 mt-2">
                                                                    <span>{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</span>
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
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
                                        <Link href={`${basePath}/profile`} onClick={() => setSidebarOpen(false)}>
                                            <Button variant="ghost" className="w-full justify-start h-9 px-3 text-sm font-medium text-slate-700">
                                                <User className="w-4 h-4 mr-2" /> Profile
                                            </Button>
                                        </Link>
                                        <Link href={`${basePath}/preferences`} onClick={() => setSidebarOpen(false)}>
                                            <Button variant="ghost" className="w-full justify-start h-9 px-3 text-sm font-medium text-slate-700">
                                                <Settings className="w-4 h-4 mr-2" /> Preferences
                                            </Button>
                                        </Link>
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
