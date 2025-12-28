"use client"

import { useEffect, useState, Suspense, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import api from "@/lib/api"

function VerifyEmailContent() {
    const searchParams = useSearchParams()
    const token = searchParams.get("token")

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [errorMessage, setErrorMessage] = useState('')
    const hasVerified = useRef(false)

    useEffect(() => {
        if (!token) {
            setStatus('error')
            setErrorMessage('Invalid verification link. No token provided.')
            return
        }

        // Prevent duplicate calls (React Strict Mode runs effects twice in dev)
        if (hasVerified.current) {
            return
        }
        hasVerified.current = true

        // Call API directly
        const verifyEmail = async () => {
            try {
                const response = await api.get(`/auth/verify-email/${token}`)
                if (response.data.success) {
                    setStatus('success')
                    toast.success(response.data.data.message || 'Email verified successfully!')
                } else {
                    setStatus('error')
                    setErrorMessage(response.data.error || 'Verification failed')
                    toast.error(response.data.error || 'Email verification failed')
                }
            } catch (error: any) {
                setStatus('error')
                const errMsg = error.response?.data?.error || 'The verification link is invalid or has expired.'
                setErrorMessage(errMsg)
                toast.error(errMsg)
            }
        }

        verifyEmail()
    }, [token])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <div className="text-center">
                        {status === 'loading' && (
                            <>
                                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                                </div>
                                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                                    Verifying Your Email
                                </h1>
                                <p className="text-slate-600">
                                    Please wait while we verify your email address...
                                </p>
                            </>
                        )}

                        {status === 'success' && (
                            <>
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                                </div>
                                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                                    Email Verified! ✓
                                </h1>
                                <p className="text-slate-600 mb-6">
                                    Your email has been verified successfully! You can now log in.
                                </p>
                                <Link href="/login">
                                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                                        Continue to Login
                                    </Button>
                                </Link>
                            </>
                        )}

                        {status === 'error' && (
                            <>
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <XCircle className="w-8 h-8 text-red-600" />
                                </div>
                                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                                    Verification Failed
                                </h1>
                                <p className="text-slate-600 mb-6">
                                    {errorMessage}
                                </p>
                                <div className="flex flex-col gap-3">
                                    <Link href="/login">
                                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                                            Back to Login
                                        </Button>
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-slate-400 text-sm mt-6">
                    © 2024 QuixHR. All rights reserved.
                </p>
            </div>
        </div>
    )
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    )
}
