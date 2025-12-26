"use client"

import { useState, useEffect, Suspense, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { useAcceptInvite, useValidateInvite } from "@/lib/hooks/useAuth"

function JoinPageContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const token = searchParams.get("token")

    const [inviteDetails, setInviteDetails] = useState<any>(null)
    const [pageError, setPageError] = useState("")

    // Registration Form State
    const [name, setName] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [formError, setFormError] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const isSubmittingRef = useRef(false)

    const validateInviteMutation = useValidateInvite()
    const acceptInviteMutation = useAcceptInvite()

    useEffect(() => {
        if (!token) {
            setPageError("Invalid invitation link. Token is missing.")
            return
        }

        validateInviteMutation.mutate(token, {
            onSuccess: (data: any) => {
                setInviteDetails(data.data)
            },
            onError: (error: any) => {
                setPageError(error.response?.data?.message || "Invalid or expired invitation")
            }
        })
    }, [token])

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault()
        if (isSubmittingRef.current) return

        if (password !== confirmPassword) {
            setFormError("Passwords do not match")
            return
        }

        setFormError("")
        if (!token) return

        isSubmittingRef.current = true
        setIsSubmitting(true)

        acceptInviteMutation.mutate({
            token,
            name,
            password
        }, {
            onSuccess: (data: any) => {
                // Success - Store token and redirect
                localStorage.setItem("token", data.data.token)
                localStorage.setItem("user", JSON.stringify(data.data.user))
                router.push("/dashboard")
            },
            onError: (error: any) => {
                setFormError(error.response?.data?.message || "Failed to join")
                isSubmittingRef.current = false
                setIsSubmitting(false)
            }
        })
    }

    if (validateInviteMutation.isPending) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        )
    }

    if (pageError && !inviteDetails) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
                <Card className="max-w-md w-full border-slate-200 shadow-xl">
                    <CardHeader className="space-y-1">
                        <div className="flex items-center gap-2 text-rose-600 mb-2">
                            <AlertCircle className="w-6 h-6" />
                            <h2 className="text-lg font-bold">Invitation Error</h2>
                        </div>
                        <p className="text-slate-500">{pageError}</p>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => router.push("/login")} className="w-full bg-slate-900">
                            Go to Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
            <Card className="max-w-md w-full border-slate-200 shadow-xl bg-white">
                <CardHeader className="space-y-1 text-center pb-8 border-b border-slate-100">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        Join {inviteDetails?.organization?.name}
                    </h1>
                    <p className="text-slate-500 text-sm">
                        You have been invited to join as a <span className="font-bold text-slate-700">{inviteDetails?.role}</span>
                    </p>
                    <div className="mt-4 p-3 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg inline-block">
                        {inviteDetails?.email}
                    </div>
                </CardHeader>
                <CardContent className="pt-8">
                    <form onSubmit={handleJoin} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-500">Full Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter your full name"
                                className="h-10 rounded-lg border-slate-200 focus:ring-slate-900"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-500">Create Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="h-10 rounded-lg border-slate-200 focus:ring-slate-900 pr-10"
                                    required
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors bg-transparent border-0 p-0"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-wider text-slate-500">Confirm Password</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="h-10 rounded-lg border-slate-200 focus:ring-slate-900 pr-10"
                                    required
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors bg-transparent border-0 p-0"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {formError && (
                            <Alert variant="destructive" className="bg-rose-50 border-rose-100 text-rose-600 rounded-lg">
                                <AlertDescription className="text-xs font-bold">{formError}</AlertDescription>
                            </Alert>
                        )}

                        <Button
                            type="submit"
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-11 rounded-xl shadow-lg mt-2"
                            disabled={isSubmitting || acceptInviteMutation.isPending}
                        >
                            {isSubmitting || acceptInviteMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating Account...
                                </>
                            ) : (
                                "Create Account & Join"
                            )}
                        </Button>

                        <div className="text-center text-xs text-slate-400 font-medium pt-2">
                            By joining, you agree to our Terms of Service and Privacy Policy.
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

export default function JoinPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        }>
            <JoinPageContent />
        </Suspense>
    )
}
