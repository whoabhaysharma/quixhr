"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useResetPassword } from "@/lib/hooks/useAuth"
import { toast } from "sonner"

export default function ResetPasswordPage() {
    const searchParams = useSearchParams()

    // Support both 'token' (standard) and 'oobCode' (Firebase style/local test)
    const token = searchParams.get("token") || searchParams.get("oobCode")

    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
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

        resetPasswordMutation.mutate({ token, password }, {
            onSuccess: () => {
                setSuccess(true)
            }
        })
    }

    if (success) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-[#fbfbfb] text-black relative font-sans">
                <div className="absolute inset-0 bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:24px_24px] opacity-10"></div>
                <Card className="w-full max-w-[500px] z-10 border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none">
                    <CardHeader className="text-center space-y-4 pt-8">
                        <CardTitle className="text-3xl font-black tracking-tighter uppercase text-[#00e378]">Success!</CardTitle>
                        <CardDescription className="text-black font-medium text-base">
                            Your password has been reset successfully.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-4 text-center">
                        <Link href="/login">
                            <Button className="w-full bg-black text-white border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-black text-lg h-12 uppercase">
                                Go to Login
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#fbfbfb] text-black relative font-sans">
            {/* Dot Pattern Background */}
            <div className="absolute inset-0 bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:24px_24px] opacity-10"></div>

            <Card className="w-full max-w-[500px] z-10 border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none">
                <CardHeader className="text-center space-y-4 pt-8">
                    <div className="mx-auto bg-black text-white px-3 py-1 text-xl font-black tracking-tighter inline-block transform -rotate-2">
                        SECURE ACCOUNT
                    </div>
                    <CardTitle className="text-3xl font-black tracking-tighter uppercase">Reset Password</CardTitle>
                    <CardDescription className="text-black font-medium text-base">
                        Enter your new password.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-4">
                    {!token ? (
                        <div className="text-center">
                            <p className="font-bold">Missing Reset Token</p>
                            <Link href="/forgot-password" className="underline">Request a new link</Link>
                        </div>
                    ) : (
                        <form onSubmit={handleReset} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password" className="font-bold text-base uppercase">New Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] focus-visible:ring-0 focus-visible:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus-visible:translate-x-[-2px] focus-visible:translate-y-[-2px] transition-all bg-white font-bold h-12"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="font-bold text-base uppercase">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] focus-visible:ring-0 focus-visible:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus-visible:translate-x-[-2px] focus-visible:translate-y-[-2px] transition-all bg-white font-bold h-12"
                                    required
                                />
                            </div>
                            <Button type="submit" disabled={resetPasswordMutation.isPending} className="w-full bg-[#00e378] text-black border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-black text-lg h-12 uppercase">
                                {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
                            </Button>
                        </form>
                    )}
                </CardContent>
                <CardFooter className="justify-center pb-8">
                    <Link href="/login" className="text-sm font-bold underline decoration-2 underline-offset-2 hover:bg-black hover:text-white transition-colors px-1">
                        Back to Login
                    </Link>
                </CardFooter>
            </Card>
        </div>
    )
}
