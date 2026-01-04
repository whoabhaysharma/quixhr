"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { invitationService } from "@/lib/services/invitation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { CheckCircle2, XCircle } from "lucide-react"

const acceptInviteSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm password is required"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
})

type AcceptInviteFormData = z.infer<typeof acceptInviteSchema>

export default function AcceptInvitePage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const token = searchParams.get("token")

    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [inviteDetails, setInviteDetails] = useState<{
        email: string
        role: string
        organizationName: string
    } | null>(null)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<AcceptInviteFormData>({
        resolver: zodResolver(acceptInviteSchema),
    })

    useEffect(() => {
        if (!token) {
            setError("Invalid invitation link. Token is missing.")
            setIsLoading(false)
            return
        }

        const verifyToken = async () => {
            try {
                const response = await invitationService.validateToken(token)
                if (response.success) {
                    setInviteDetails(response.data)
                } else {
                    setError(response.message || "Failed to verify invitation")
                }
            } catch (err: any) {
                console.error("Token verification failed", err)
                setError(err.response?.data?.message || (typeof err.response?.data?.error === 'string' ? err.response?.data?.error : "Invalid or expired invitation link"))
            } finally {
                setIsLoading(false)
            }
        }

        verifyToken()
    }, [token])

    const onSubmit = async (data: AcceptInviteFormData) => {
        if (!token) return

        setIsSubmitting(true)
        try {
            await invitationService.accept({
                token,
                firstName: data.firstName,
                lastName: data.lastName,
                password: data.password,
            })
            toast.success("Account created successfully! Redirecting to login...")
            setTimeout(() => {
                router.push("/login")
            }, 2000)
        } catch (err: any) {
            console.error("Accept invitation failed", err)
            toast.error(err.response?.data?.message || (typeof err.response?.data?.error === 'string' ? err.response?.data?.error : "Failed to accept invitation"))
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center space-y-4">
                    <Spinner className="w-8 h-8 mx-auto text-indigo-600" />
                    <p className="text-slate-500">Verifying invitation...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                            <XCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <CardTitle className="text-xl text-red-700">Invitation Error</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <p className="text-slate-600">{error}</p>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => router.push("/login")}
                        >
                            Back to Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center space-y-2">
                    <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        Join {inviteDetails?.organizationName}
                    </h1>
                    <p className="text-slate-500 text-sm">
                        You've been invited to join as <strong>{inviteDetails?.role}</strong> using <br />
                        <span className="font-medium text-slate-900">{inviteDetails?.email}</span>
                    </p>
                </div>

                <Card>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First Name</Label>
                                    <Input
                                        id="firstName"
                                        placeholder="John"
                                        {...register("firstName")}
                                    />
                                    {errors.firstName && (
                                        <p className="text-xs text-red-500">{errors.firstName.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input
                                        id="lastName"
                                        placeholder="Doe"
                                        {...register("lastName")}
                                    />
                                    {errors.lastName && (
                                        <p className="text-xs text-red-500">{errors.lastName.message}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Create Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    {...register("password")}
                                />
                                {errors.password && (
                                    <p className="text-xs text-red-500">{errors.password.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    {...register("confirmPassword")}
                                />
                                {errors.confirmPassword && (
                                    <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
                                )}
                            </div>

                            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Spinner className="mr-2 h-4 w-4" /> Creating Account...
                                    </>
                                ) : (
                                    "Create Account"
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
