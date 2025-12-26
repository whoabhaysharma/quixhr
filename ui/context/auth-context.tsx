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





                // Check Onboarding
                if (!decoded.organizationId && decoded.role !== 'SUPER_ADMIN') {
                    if (pathname !== '/onboarding') {
                        router.push('/onboarding')
                    }
                } else if (pathname === '/onboarding' && (decoded.organizationId || decoded.role === 'SUPER_ADMIN')) {
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
