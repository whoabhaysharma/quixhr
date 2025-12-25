"use client"

import { useAuth } from "@/context/auth-context"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
    LayoutDashboard,
    Users,
    Calendar,
    LogOut,
    Menu,
    X,
    Settings,
    Search,
    Bell,
    ChevronDown,
    User,
    Plus,
    CalendarDays,
    Clock,
    Timer
} from "lucide-react"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { isAuthenticated, isLoading, logout, user } = useAuth()
    const router = useRouter()
    const pathname = usePathname()
    const [isSidebarOpen, setSidebarOpen] = useState(false)

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/login")
        }
    }, [isLoading, isAuthenticated, router])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-neutral-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin"></div>
                    <p className="text-neutral-500 font-medium animate-pulse">Loading Workspace...</p>
                </div>
            </div>
        )
    }

    if (!isAuthenticated) return null

    const isManagementRole = ['HR', 'ADMIN', 'SUPER_ADMIN'].includes(user?.role || '')

    const personalNavItems = [
        { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
        { name: "Attendance", href: "/attendance", icon: Timer, roles: ['EMPLOYEE'] },
        { name: "Time Off", href: "/leaves", icon: Calendar, roles: ['EMPLOYEE'] },
        { name: "Holidays", href: "/holidays", icon: CalendarDays },
    ].filter(item => !item.roles || (user?.role && item.roles.includes(user.role)))

    const managementNavItems = [
        { name: "People", href: "/manage/members", icon: Users },
        { name: "Attendance", href: "/manage/attendance", icon: Clock },
        { name: "Leave Requests", href: "/manage/leaves", icon: Calendar },
    ]

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
            <aside
                className={`
                    fixed lg:static inset-y-0 left-0 z-50
                    w-[280px] bg-[#0F172A] border-r border-neutral-800
                    transform transition-transform duration-300 ease-in-out
                    flex flex-col h-full shrink-0
                    ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
                `}
            >
                {/* Brand */}
                <div className="h-20 flex items-center px-8 border-b border-neutral-800/50 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/30">
                            Q
                        </div>
                        <span className="text-xl font-bold tracking-tight text-white">QuixHR</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
                    <div>
                        <p className="px-4 text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                            My Workspace
                        </p>
                        <div className="space-y-1">
                            {personalNavItems.map((item) => {
                                const isActive = pathname === item.href
                                const Icon = item.icon
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setSidebarOpen(false)}
                                        className={`
                                            flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group
                                            ${isActive
                                                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                                                : "text-neutral-400 hover:bg-white/5 hover:text-white"
                                            }
                                        `}
                                    >
                                        <Icon className={`w-5 h-5 transition-colors ${isActive ? "text-white" : "text-neutral-500 group-hover:text-white"}`} />
                                        {item.name}
                                    </Link>
                                )
                            })}
                        </div>
                    </div>

                    {isManagementRole && (
                        <div>
                            <p className="px-4 text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                                Management
                            </p>
                            <div className="space-y-1">
                                {managementNavItems.map((item) => {
                                    const isActive = pathname === item.href
                                    const Icon = item.icon
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setSidebarOpen(false)}
                                            className={`
                                            flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group
                                            ${isActive
                                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                                                    : "text-neutral-400 hover:bg-white/5 hover:text-white"
                                                }
                                        `}
                                        >
                                            <Icon className={`w-5 h-5 transition-colors ${isActive ? "text-white" : "text-neutral-500 group-hover:text-white"}`} />
                                            {item.name}
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    <div>
                        <p className="px-4 text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                            Support
                        </p>
                        <div className="space-y-1">
                            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-neutral-400 hover:bg-white/5 hover:text-white transition-all duration-200 group text-left">
                                <Settings className="w-5 h-5 text-neutral-500 group-hover:text-white" />
                                Settings
                            </button>
                            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-neutral-400 hover:bg-white/5 hover:text-white transition-all duration-200 group text-left">
                                <span className="w-5 h-5 flex items-center justify-center rounded-full border border-neutral-600 text-[10px] font-bold group-hover:border-white">?</span>
                                Help Center
                            </button>
                        </div>
                    </div>
                </nav>

                {/* Upgrade Card */}
                <div className="p-4 mt-auto shrink-0">
                    <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-xl p-4 border border-neutral-700/50">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-1.5 bg-yellow-500/10 rounded-lg">
                                <span className="text-yellow-500 text-xs font-bold">PRO</span>
                            </div>
                            <p className="text-white text-sm font-bold">Upgrade Plan</p>
                        </div>
                        <p className="text-neutral-400 text-xs mb-3">Get access to advanced analytics and more members.</p>
                        <Button size="sm" variant="outline" className="w-full bg-transparent border-neutral-700 text-white hover:bg-white hover:text-black transition-colors h-8 text-xs">
                            View Plans
                        </Button>
                    </div>
                </div>

                {/* Mobile Logout */}
                <div className="p-4 border-t border-neutral-800 lg:hidden shrink-0">
                    <Button
                        onClick={logout}
                        variant="ghost"
                        className="w-full justify-start text-neutral-400 hover:text-white hover:bg-white/5 gap-2"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </Button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
                {/* Modern Command Center Header */}
                <header className="sticky top-0 z-40 h-16 w-full border-b border-slate-200/60 bg-white/80 backdrop-blur-xl shrink-0 transition-all duration-300">
                    <div className="flex h-full items-center justify-between px-4 lg:px-8 max-w-[1600px] mx-auto">

                        {/* Left Side: Navigation & Command Search */}
                        <div className="flex items-center gap-6 flex-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="lg:hidden h-10 w-10 text-slate-500 hover:bg-slate-100 rounded-full"
                                onClick={() => setSidebarOpen(true)}
                            >
                                <Menu className="w-5 h-5" />
                            </Button>

                            {/* Global Search / Command Palette Bar */}
                            <div className="hidden md:flex items-center group flex-1 max-w-sm">
                                <div className="relative w-full">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Search or jump to..."
                                        className="w-full bg-slate-100/50 border border-transparent h-10 pl-10 pr-12 rounded-xl text-sm transition-all focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-500/5 outline-none"
                                    />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                        <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-slate-200 bg-white px-1.5 font-mono text-[10px] font-medium text-slate-400">
                                            <span className="text-xs">⌘</span>K
                                        </kbd>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Quick Actions & Intelligence */}
                        <div className="flex items-center gap-3">

                            {/* Action Buttons Group */}
                            <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-full border border-slate-200/50">
                                <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full text-slate-500 hover:text-indigo-600 transition-colors">
                                    <Plus className="w-4 h-4" />
                                </Button>
                                <div className="w-px h-4 bg-slate-200/60 mx-1"></div>

                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="ghost" size="icon" className="relative w-8 h-8 rounded-full text-slate-500 hover:text-indigo-600 transition-colors">
                                            <Bell className="w-4 h-4" />
                                            {/* Animated Ping Dot */}
                                            <span className="absolute top-2 right-2 flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                            </span>
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80 mt-2 p-0 rounded-2xl shadow-2xl border-slate-200" align="end">
                                        <div className="p-4 bg-slate-50/50 rounded-t-2xl border-b border-slate-100 flex items-center justify-between">
                                            <h4 className="font-bold text-xs uppercase tracking-widest text-slate-500">Activity</h4>
                                            <span className="text-[10px] text-indigo-600 font-bold cursor-pointer hover:underline">Mark all read</span>
                                        </div>
                                        <div className="p-8 text-center space-y-3">
                                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                                                <Bell className="w-5 h-5 text-slate-300" />
                                            </div>
                                            <p className="text-sm font-medium text-slate-400 italic">No updates in your feed</p>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Profile Section */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex items-center gap-2 group p-0.5 pr-3 rounded-full hover:bg-slate-100/80 transition-all outline-none">
                                        <div className="relative">
                                            <Avatar className="h-9 w-9 border-2 border-white shadow-sm ring-1 ring-slate-200">
                                                <AvatarFallback className="bg-gradient-to-tr from-indigo-500 to-violet-500 text-white font-black text-xs">
                                                    {user?.name?.charAt(0) || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                                        </div>
                                        <div className="hidden text-left lg:block">
                                            <p className="text-xs font-bold text-slate-900 leading-none">{user?.name}</p>
                                            <p className="text-[10px] text-slate-500 font-medium tracking-wide mt-1 uppercase italic">
                                                {user?.role}
                                            </p>
                                        </div>
                                        <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-900 transition-colors" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-60 p-1.5 rounded-2xl shadow-xl border-slate-200 mt-2">
                                    <div className="px-3 py-2 border-b border-slate-100 mb-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Connected as</p>
                                        <p className="text-xs font-semibold text-slate-600 truncate">{user?.email}</p>
                                    </div>
                                    <DropdownMenuItem className="rounded-xl py-2 cursor-pointer focus:bg-slate-50">
                                        <User className="w-4 h-4 mr-2 text-slate-400" />
                                        <span className="text-sm font-medium">Profile Details</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="rounded-xl py-2 cursor-pointer focus:bg-slate-50">
                                        <Settings className="w-4 h-4 mr-2 text-slate-400" />
                                        <span className="text-sm font-medium">Preferences</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-slate-100" />
                                    <DropdownMenuItem onClick={logout} className="rounded-xl py-2 cursor-pointer text-rose-600 focus:bg-rose-50 focus:text-rose-600">
                                        <LogOut className="w-4 h-4 mr-2" />
                                        <span className="text-sm font-bold">Sign Out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </header>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto bg-[#F8FAFC] pb-8">
                    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto w-full">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    )
}
