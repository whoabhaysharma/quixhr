"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

import { useRouter, usePathname } from "next/navigation"
import { jwtDecode } from "jwt-decode"
import { useCurrentUser } from "@/lib/hooks/useAuth"

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

    // Use query for user data
    // Use query for user data
    const { data: userData, isSuccess, error } = useCurrentUser({
        enabled: typeof window !== 'undefined' && !!localStorage.getItem("token")
    })

    useEffect(() => {
        if (isSuccess && userData?.success && userData.data) {
            setUser(userData.data)
        }
    }, [userData, isSuccess])

    useEffect(() => {
        if (error) {
            console.error("Session expired or invalid", error)
            logout()
        }
    }, [error])

    const checkAuth = async (token: string | null) => {
        if (token) {
            try {
                const decoded: any = jwtDecode(token)

                // Check expiration
                if (decoded.exp * 1000 < Date.now()) {
                    logout()
                    return
                }

                // Initial set from token (fast)
                setUser(decoded)
                setIsAuthenticated(true)

                // Redirect to dashboard if on auth pages
                if (pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/join')) {
                    if (decoded.role === 'SUPER_ADMIN') router.push('/s/dashboard');
                    else if (['ORG_ADMIN', 'HR_ADMIN', 'MANAGER'].includes(decoded.role)) router.push('/a/dashboard');
                    else router.push('/e/dashboard');
                }

            } catch (error) {
                console.error('Token verification failed:', error);
                localStorage.removeItem('token');
                setUser(null);
                setIsAuthenticated(false);
                if (!pathname.startsWith('/login') && !pathname.startsWith('/register') && !pathname.startsWith('/join')) {
                    router.push('/login');
                }
            } finally {
                setIsLoading(false);
            }
        } else {
            setIsAuthenticated(false)
            setUser(null)
            setIsLoading(false)
        }
    }

    useEffect(() => {
        // Only check auth on initial mount, not on every pathname change
        const token = localStorage.getItem("token")
        checkAuth(token)
    }, []) // Empty dependency array - only run once on mount

    const login = (token: string) => {
        localStorage.setItem("token", token)
        checkAuth(token)
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
