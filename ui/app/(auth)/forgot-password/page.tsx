"use client"

import { useState } from "react"
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [email, setEmail] = useState("")
    const [message, setMessage] = useState("")
    const [error, setError] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email) {
            setError("Email is required")
            return
        }

        setIsLoading(true)
        setError("")
        setMessage("")

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error?.message || "Failed to send reset link")
            }

            // In a real app with email service, we'd say "Check your email".
            // Since the backend returns the link directly (temporary), we display it or log it.
            // For better UX, let's just show a success message assuming it was "sent".
            // If the user *needs* the link (dev mode), we might display it.
            // The prompt said: "this link is returned directly in the API response for now."

            setMessage("We have generated a password reset link for you.")
            if (data.data?.link) {
                // Extract oobCode for easier local testing
                try {
                    const url = new URL(data.data.link);
                    const oobCode = url.searchParams.get("oobCode");
                    if (oobCode) {
                        const localLink = `${window.location.origin}/reset-password?oobCode=${oobCode}`;
                        setMessage(`Password reset link generated. Click below to test locally: ${localLink}`);
                    } else {
                        setMessage(`Password reset link generated: ${data.data.link}`);
                    }
                } catch (e) {
                    setMessage(`Password reset link generated: ${data.data.link}`);
                }
            } else {
                setMessage("Password reset email sent (simulated).")
            }

        } catch (err: any) {
            setError(err.message || "An error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#fbfbfb] text-black relative font-sans">
            {/* Dot Pattern Background */}
            <div className="absolute inset-0 bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:24px_24px] opacity-10"></div>

            <Card className="w-full max-w-[500px] z-10 border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none">
                <CardHeader className="text-center space-y-4 pt-8">
                    <div className="mx-auto bg-black text-white px-3 py-1 text-xl font-black tracking-tighter inline-block transform -rotate-2">
                        RECOVER ACCESS
                    </div>
                    <CardTitle className="text-3xl font-black tracking-tighter uppercase">Forgot Password</CardTitle>
                    <CardDescription className="text-black font-medium text-base">
                        Enter your email to receive a reset link.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-4">
                    {error && <p className="text-red-500 font-bold text-center border-2 border-red-500 p-2 bg-red-50">{error}</p>}
                    {message && (
                        <div className="text-green-600 font-bold text-center border-2 border-green-600 p-2 bg-green-50 break-words">
                            {message.startsWith("Password reset link generated. Click below") ? (
                                <>
                                    <p className="mb-2">Link generated for testing:</p>
                                    <a href={message.split(": ")[1]} className="underline decoration-2">Click to Reset (Local)</a>
                                </>
                            ) : message.startsWith("Password reset link generated:") ? (
                                <>
                                    <p className="mb-2">Link generated:</p>
                                    <a href={message.replace("Password reset link generated: ", "")} target="_blank" rel="noopener noreferrer" className="underline decoration-2">Click to Reset</a>
                                </>
                            ) : message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="font-bold text-base uppercase">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="YOUR@EMAIL.COM"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] focus-visible:ring-0 focus-visible:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus-visible:translate-x-[-2px] focus-visible:translate-y-[-2px] transition-all bg-white font-bold placeholder:text-gray-400 placeholder:font-medium h-12"
                                required
                            />
                        </div>
                        <Button type="submit" disabled={isLoading} className="w-full bg-[#ffd300] text-black border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-black text-lg h-12 uppercase">
                            {isLoading ? "Sending..." : "Send Reset Link"}
                        </Button>
                    </form>
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
