"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { jwtDecode } from "jwt-decode"

interface AuthContextType {
    isAuthenticated: boolean
    isLoading: boolean
    login: (token: string) => void
    logout: () => void
    user: any | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [user, setUser] = useState<any | null>(null)
    const router = useRouter()
    const pathname = usePathname()

    const checkAuth = (token: string | null) => {
        if (token) {
            try {
                const decoded: any = jwtDecode(token)

                // Check expiration
                if (decoded.exp * 1000 < Date.now()) {
                    logout()
                    return
                }

                setUser(decoded)
                setIsAuthenticated(true)

                // Check Onboarding - Redirect if no org and not super admin (assuming super admin doesn't need org for now)
                // Also ensure we don't redirect if already ON the onboarding page
                if (!decoded.organizationId && decoded.role !== 'SUPER_ADMIN') {
                    if (pathname !== '/onboarding') {
                        router.push('/onboarding')
                    }
                } else if (pathname === '/onboarding' && (decoded.organizationId || decoded.role === 'SUPER_ADMIN')) {
                    // If on onboarding but technically done, go to dashboard
                    router.push('/dashboard')
                }

            } catch (e) {
                console.error("Invalid token", e)
                logout()
            }
        } else {
            setIsAuthenticated(false)
            setUser(null)
        }
        setIsLoading(false)
    }

    useEffect(() => {
        const token = localStorage.getItem("token")
        checkAuth(token)
    }, [pathname]) // Re-check on path change to enforce protection

    const login = (token: string) => {
        localStorage.setItem("token", token)
        checkAuth(token)
        // Router push is handled inside checkAuth logic or by component calling login if needed, 
        // but usually login() implies we want to go dashboard or onboarding.
        // Let's explicitly push based on state in checkAuth? 
        // checkAuth sets state, but router.push might be async.
        // Let's do a manual check here for immediate feedback to the caller (LoginPage)
        const decoded: any = jwtDecode(token)
        if (!decoded.organizationId && decoded.role !== 'SUPER_ADMIN') {
            router.push("/onboarding")
        } else {
            router.push("/dashboard")
        }
    }

    const logout = () => {
        localStorage.removeItem("token")
        setIsAuthenticated(false)
        setUser(null)
        router.push("/login")
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout, user }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}
