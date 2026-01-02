"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"
import { useLogin } from "@/lib/hooks/useAuth"

export default function LoginPage() {
    const { login } = useAuth()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState("")

    const loginMutation = useLogin()

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        try {
            const response = await loginMutation.mutateAsync({ email, password })
            if (response.status === 'success') {
                login(response.data.accessToken)

                // Redirect based on role
                if (response.data.user.role === 'SUPER_ADMIN') {
                    window.location.href = '/s/dashboard'
                } else if (['ORG_ADMIN', 'HR_ADMIN', 'MANAGER'].includes(response.data.user.role)) {
                    window.location.href = '/a/dashboard'
                } else {
                    window.location.href = '/e/dashboard'
                }
            } else {
                setError(response.message || "Invalid credentials")
            }
        } catch (err: any) {
            setError(err.response?.data?.error?.message || "Login failed")
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
                                    <Label htmlFor="password" className="text-slate-700">Password</Label>
                                    <Link href="/forgot-password" className="text-xs font-medium text-slate-600 hover:text-slate-900">
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-10 rounded-md border-slate-200 focus:ring-slate-900 focus:border-slate-900 pr-10"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-md font-medium">{error}</p>}

                            <Button
                                type="submit"
                                disabled={loginMutation.isPending}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl shadow-lg transition-all"
                            >
                                {loginMutation.isPending ? "Signing in..." : "Sign In with Email"}
                            </Button>
                        </form>

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
