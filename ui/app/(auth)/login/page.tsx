"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { auth } from "@/lib/firebase"
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth"

export default function LoginPage() {
    const { login } = useAuth()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    const handleGoogleLogin = async () => {
        setIsLoading(true)
        setError("")
        try {
            const provider = new GoogleAuthProvider()
            const result = await signInWithPopup(auth, provider)
            const idToken = await result.user.getIdToken()

            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/firebase-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken })
            })

            const data = await response.json()
            if (response.ok) {
                login(data.data.token)
            } else {
                setError(data.error?.message || "Login failed")
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })
            const data = await response.json()
            if (response.ok) {
                login(data.data.token)
            } else {
                setError(data.error?.message || "Invalid credentials")
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-[1000px] h-[600px] bg-white rounded-2xl shadow-xl overflow-hidden flex border border-slate-100">
                {/* Left Side - Brand & Testimonial */}
                <div className="hidden lg:flex w-1/2 bg-slate-900 flex-col justify-between p-12 text-white relative overflow-hidden">
                    <div className="z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">Q</div>
                            <span className="text-xl font-bold tracking-tight">QuixHR</span>
                        </div>
                        <p className="text-blue-200 text-sm font-medium">People-first HR tools that scale.</p>
                    </div>

                    <div className="z-10 relative">
                        <div className="absolute -left-4 -top-6 text-6xl text-blue-700/50 font-serif">"</div>
                        <h2 className="text-2xl font-medium leading-relaxed mb-6 italic relative">
                            QuixHR saved us hours every week. The interface is intuitive and the insights are actionable.
                        </h2>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center font-bold text-sm text-blue-200">SD</div>
                            <div>
                                <div className="font-semibold text-white">Sofia Davis</div>
                                <div className="text-xs text-blue-300 uppercase tracking-wider">VP of Operations</div>
                            </div>
                        </div>
                    </div>

                    <div className="z-10 text-xs text-blue-300/80 space-y-1">
                        <p>• Secure Single Sign-On</p>
                        <p>• SOC2 Compliant</p>
                    </div>

                    {/* Abstract Background Shapes */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-600/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>
                </div>

                {/* Right Side - Login Form */}
                <div className="flex-1 flex flex-col justify-center p-8 lg:p-12 bg-white relative">
                    <div className="w-full max-w-sm mx-auto space-y-8">
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-slate-900 text-white mb-4 lg:hidden">
                                <span className="font-bold text-sm">Q</span>
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h2>
                            <p className="text-sm text-slate-500 mt-2">Enter your email to sign in to your account</p>
                        </div>

                        <form onSubmit={handleEmailLogin} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-700">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-10 rounded-md border-slate-200 focus:ring-slate-900 focus:border-slate-900"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" classname="text-slate-700">Password</Label>
                                    <Link href="/forgot-password" classname="text-xs font-medium text-slate-600 hover:text-slate-900">
                                        Forgot password?
                                    </Link>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="h-10 rounded-md border-slate-200 focus:ring-slate-900 focus:border-slate-900"
                                    required
                                />
                            </div>

                            {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-md font-medium">{error}</p>}

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-medium transition-all shadow-lg shadow-slate-900/10"
                            >
                                {isLoading ? "Signing in..." : "Sign In with Email"}
                            </Button>
                        </form>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-slate-100" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-slate-400">Or continue with</span>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                            className="w-full h-10 rounded-md border-slate-200 hover:bg-slate-50 font-medium text-slate-700 flex items-center justify-center gap-2"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                            Google
                        </Button>

                        <div className="text-center text-sm text-slate-500">
                            Don't have an account?{" "}
                            <Link href="/register" className="font-medium text-slate-900 hover:underline">
                                Sign up
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
