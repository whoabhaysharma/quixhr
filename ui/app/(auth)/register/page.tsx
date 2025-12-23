"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"

export default function RegisterPage() {
    const { login } = useAuth()
    const router = useRouter()
    const [name, setName] = useState("")
    const [organizationName, setOrganizationName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [otp, setOtp] = useState("")
    const [step, setStep] = useState<'register' | 'verify'>('register')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")


    const handleInitiateRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        if (password !== confirmPassword) {
            setError("Passwords do not match")
            setIsLoading(false)
            return
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/send-verification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error?.message || "Failed to send verification code")
            }

            setStep('verify')
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleVerifyAndRegister = async () => {
        setIsLoading(true)
        setError("")

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name, otp, organizationName })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error?.message || "Registration failed")
            }

            // Auto-login on success
            login(data.data.token)

        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-[1000px] h-[650px] bg-white rounded-2xl shadow-xl overflow-hidden flex border border-slate-100">
                {/* Left Side - Matching Login Theme */}
                <div className="hidden lg:flex w-1/2 bg-slate-900 flex-col justify-between p-12 text-white relative overflow-hidden">
                    <div className="z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">Q</div>
                            <span className="text-xl font-bold tracking-tight">QuixHR</span>
                        </div>
                        <p className="text-blue-200 text-sm font-medium">Join over 10,000+ companies.</p>
                    </div>

                    <div className="z-10 relative">
                        <h2 className="text-3xl font-bold leading-tight mb-6">
                            Start managing your team <span className="text-blue-400">smarter</span> today.
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <span className="text-blue-100">Free 14-day trial</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <span className="text-blue-100">No credit card required</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <span className="text-blue-100">Cancel anytime</span>
                            </div>
                        </div>
                    </div>
                    <div className="z-10 text-xs text-blue-300/80">
                        <p>© 2025 QuixHR Inc.</p>
                    </div>

                    {/* Abstract Background Shapes */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-600/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>
                </div>

                {/* Right Side - Register Form */}
                <div className="flex-1 flex flex-col justify-center p-8 lg:p-12 bg-white relative">
                    <div className="w-full max-w-sm mx-auto space-y-6">
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-slate-900 text-white mb-4 lg:hidden">
                                <span className="font-bold text-sm">Q</span>
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                                {step === 'register' ? "Create an account" : "Verify your email"}
                            </h2>
                            <p className="text-sm text-slate-500 mt-2">
                                {step === 'register'
                                    ? "Get started with QuixHR in seconds"
                                    : `We've sent a code to ${email}`}
                            </p>
                        </div>

                        {step === 'register' ? (
                            <form onSubmit={handleInitiateRegister} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-slate-700">Full Name</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        placeholder="John Doe"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="h-10 rounded-md border-slate-200 focus:ring-slate-900 focus:border-slate-900"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="orgName" className="text-slate-700">Company Name</Label>
                                    <Input
                                        id="orgName"
                                        type="text"
                                        placeholder="Acme Inc."
                                        value={organizationName}
                                        onChange={(e) => setOrganizationName(e.target.value)}
                                        className="h-10 rounded-md border-slate-200 focus:ring-slate-900 focus:border-slate-900"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-slate-700">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@company.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="h-10 rounded-md border-slate-200 focus:ring-slate-900 focus:border-slate-900"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-slate-700">Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="8+ characters"
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

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword" className="text-slate-700">Confirm Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="Confirm password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="h-10 rounded-md border-slate-200 focus:ring-slate-900 focus:border-slate-900 pr-10"
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

                                {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-md font-medium">{error}</p>}

                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-medium transition-all shadow-lg shadow-slate-900/10"
                                >
                                    {isLoading ? "Sending code..." : "Get Started"}
                                </Button>
                            </form>
                        ) : (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="otp" className="text-slate-700">Verification Code</Label>
                                    <Input
                                        id="otp"
                                        type="text"
                                        placeholder="123456"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="text-center text-2xl tracking-[0.5em] h-14 font-bold border-slate-200 focus:ring-slate-900 focus:border-slate-900"
                                        maxLength={6}
                                        autoFocus
                                    />
                                    <p className="text-xs text-slate-500 text-center">
                                        Check your spam folder if you don't see the email.
                                    </p>
                                </div>

                                {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-md font-medium">{error}</p>}

                                <div className="space-y-3">
                                    <Button
                                        onClick={handleVerifyAndRegister}
                                        disabled={isLoading || otp.length !== 6}
                                        className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-medium transition-all shadow-lg shadow-slate-900/10"
                                    >
                                        {isLoading ? "Verifying..." : "Verify & Create Account"}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => setStep('register')}
                                        className="w-full h-10 text-slate-500 hover:text-slate-900"
                                    >
                                        Back to details
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="text-center text-sm text-slate-500">
                            Already have an account?{" "}
                            <Link href="/login" className="font-medium text-slate-900 hover:underline">
                                Sign in
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
