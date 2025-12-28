"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { invitationService, Invitation } from "@/lib/services/invitation"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner"
import { AlertCircle, CheckCircle2 } from "lucide-react"

const joinSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
})

type JoinFormData = z.infer<typeof joinSchema>

function JoinForm() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const token = searchParams.get('token')

    const [invitation, setInvitation] = useState<Invitation | null>(null)
    const [isValidating, setIsValidating] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    const { register, handleSubmit, formState: { errors } } = useForm<JoinFormData>({
        resolver: zodResolver(joinSchema)
    })

    useEffect(() => {
        if (!token) {
            setError("Invalid invitation link")
            setIsValidating(false)
            return
        }

        const validateToken = async () => {
            try {
                const data = await invitationService.validateToken(token)
                setInvitation(data.data)
            } catch (err: any) {
                setError(err.response?.data?.error || "Invalid or expired invitation")
            } finally {
                setIsValidating(false)
            }
        }

        validateToken()
    }, [token])

    const onSubmit = async (data: JoinFormData) => {
        if (!token) return

        try {
            setIsSubmitting(true)
            await invitationService.accept({
                token,
                name: data.name,
                password: data.password
            })
            setIsSuccess(true)
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to create account")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isValidating) {
        return (
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
                <Spinner className="w-8 h-8 text-indigo-600" />
                <p className="text-slate-500 text-sm">Validating invitation...</p>
            </div>
        )
    }

    if (error) {
        return (
            <Card className="w-full max-w-md border-red-100 shadow-none">
                <CardHeader className="text-center">
                    <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-2">
                        <AlertCircle className="w-6 h-6 text-red-500" />
                    </div>
                    <CardTitle className="text-xl text-red-600">Invitation Invalid</CardTitle>
                    <CardDescription>{error}</CardDescription>
                </CardHeader>
                <CardFooter className="flex justify-center">
                    <Button variant="outline" asChild>
                        <Link href="/login">Return to Login</Link>
                    </Button>
                </CardFooter>
            </Card>
        )
    }

    if (isSuccess) {
        return (
            <Card className="w-full max-w-md border-emerald-100 shadow-xl">
                <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                    </div>
                    <CardTitle className="text-2xl text-emerald-600">Account Created Successfully!</CardTitle>
                    <CardDescription className="text-base mt-2">
                        Your account has been created and your email has been verified. You can now log in to access your dashboard.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                        <p className="text-sm text-slate-600 mb-1">Email:</p>
                        <p className="text-sm font-medium text-slate-900">{invitation?.email}</p>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Button
                        className="w-full bg-indigo-600 hover:bg-indigo-700"
                        asChild
                    >
                        <Link href="/login">Go to Login</Link>
                    </Button>
                </CardFooter>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-md shadow-xl border-slate-200">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center">Join Organization</CardTitle>
                <CardDescription className="text-center">
                    Set up your account to join as <span className="font-bold text-indigo-600">{invitation?.role}</span>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div className="text-sm text-emerald-800">
                        <p className="font-medium">Invitation Verified</p>
                        <p className="text-xs opacity-90">{invitation?.email}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                            id="name"
                            {...register("name")}
                            placeholder="John Doe"
                        />
                        {errors.name && (
                            <p className="text-xs text-red-500">{errors.name.message}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Create Password</Label>
                        <Input
                            id="password"
                            type="password"
                            {...register("password")}
                            placeholder="••••••••"
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
                            {...register("confirmPassword")}
                            placeholder="••••••••"
                        />
                        {errors.confirmPassword && (
                            <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
                        )}
                    </div>
                    <Button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-700"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Creating Account..." : "Join Organization"}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex justify-center text-xs text-slate-500">
                Already have an account? <Link href="/login" className="text-indigo-600 hover:underline ml-1">Sign in</Link>
            </CardFooter>
        </Card>
    )
}

export default function JoinPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
            <Suspense fallback={<Spinner className="w-8 h-8 text-indigo-600" />}>
                <JoinForm />
            </Suspense>
        </div>
    )
}
