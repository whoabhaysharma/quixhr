"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useResetPassword } from "@/lib/hooks/useAuth"
import { Eye, EyeOff, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

export default function ResetPasswordPage() {
    const searchParams = useSearchParams()
    const router = useRouter()

    // Support both 'token' (standard) and 'oobCode' (Firebase style/local test)
    const token = searchParams.get("token") || searchParams.get("oobCode")

    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [success, setSuccess] = useState(false)

    const resetPasswordMutation = useResetPassword()

    const handleReset = (e: React.FormEvent) => {
        e.preventDefault()
        if (password !== confirmPassword) {
            toast.error("Passwords do not match")
            return
        }
        if (password.length < 6) {
            toast.error("Password must be at least 6 characters")
            return
        }
        if (!token) {
            toast.error("Missing reset token")
            return
        }

        resetPasswordMutation.mutate({ token, password, confirmPassword }, {
            onSuccess: () => {
                setSuccess(true)
            }
        })
    }

    if (success) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4">
                <div className="w-full max-w-[500px] bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 p-8 text-center space-y-6">
                    <div className="flex justify-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-slate-900">Password Reset!</h2>
                        <p className="text-slate-500">
                            Your password has been reset successfully.
                        </p>
                        <p className="text-sm text-slate-400">
                            You can now log in with your new password.
                        </p>
                    </div>
                    <div className="pt-4">
                        <Link href="/login">
                            <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl">
                                Go to Login
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-[1000px] h-[600px] bg-white rounded-2xl shadow-xl overflow-hidden flex border border-slate-100">
                {/* Left Side - Brand */}
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
                            Create a strong password to keep your account secure.
                        </h2>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center font-bold text-sm text-blue-200">SD</div>
                            <div>
                                <div className="font-semibold text-white">Security Team</div>
                                <div className="text-xs text-blue-300 uppercase tracking-wider">QuixHR</div>
                            </div>
                        </div>
                    </div>

                    <div className="z-10 text-xs text-blue-300/80 space-y-1">
                        <p>• Secure Password Hashing</p>
                        <p>• SOC2 Compliant</p>
                    </div>

                    {/* Abstract Background Shapes */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-600/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>
                </div>

                {/* Right Side - Form */}
                <div className="flex-1 flex flex-col justify-center p-8 lg:p-12 bg-white relative">
                    <div className="w-full max-w-sm mx-auto space-y-8">
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-slate-900 text-white mb-4 lg:hidden">
                                <span className="font-bold text-sm">Q</span>
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Reset Password</h2>
                            <p className="text-sm text-slate-500 mt-2">Enter your new password</p>
                        </div>

                        {!token ? (
                            <div className="text-center space-y-4">
                                <p className="text-red-500 font-medium">Missing Reset Token</p>
                                <Link href="/forgot-password">
                                    <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl">
                                        Request a new link
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={handleReset} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-slate-700">New Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="h-10 rounded-md border-slate-200 focus:ring-slate-900 focus:border-slate-900 pr-10"
                                            placeholder="8+ characters"
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

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword" className="text-slate-700">Confirm Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="h-10 rounded-md border-slate-200 focus:ring-slate-900 focus:border-slate-900 pr-10"
                                            placeholder="Confirm password"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={resetPasswordMutation.isPending}
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl shadow-lg transition-all"
                                >
                                    {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
                                </Button>
                            </form>
                        )}

                        <div className="text-center text-sm text-slate-500">
                            <Link href="/login" className="font-medium text-slate-900 hover:underline">
                                Back to Login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
