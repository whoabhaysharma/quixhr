"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function OnboardingPage() {
    const router = useRouter()
    const { login } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [orgName, setOrgName] = useState("")
    const [error, setError] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!orgName.trim()) {
            setError("Organization name is required")
            return
        }

        setIsLoading(true)
        setError("")

        try {
            const token = localStorage.getItem("token")
            if (!token) {
                router.push("/login")
                return
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/onboarding/organization`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ name: orgName }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error?.message || "Failed to create organization")
            }

            // Update token with new one containing orgId
            login(data.data.token) // This redirects to /dashboard

        } catch (err: any) {
            console.error(err)
            setError(err.message || "An error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-[1000px] h-[600px] bg-white rounded-2xl shadow-xl overflow-hidden flex border border-slate-100">
                {/* Left Side - Brand & Info */}
                <div className="hidden lg:flex w-1/2 bg-slate-900 flex-col justify-between p-12 text-white relative overflow-hidden">
                    <div className="z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">Q</div>
                            <span className="text-xl font-bold tracking-tight">QuixHR</span>
                        </div>
                        <p className="text-blue-200 text-sm font-medium">Setup your workspace.</p>
                    </div>

                    <div className="z-10 relative">
                        <h2 className="text-3xl font-bold leading-tight mb-6">
                            Lets get your organization <span className="text-blue-400">ready for action.</span>
                        </h2>
                        <p className="text-slate-400 text-lg">
                            Create a workspace to manage your team, track leaves, and get insights.
                        </p>
                    </div>

                    <div className="z-10 text-xs text-blue-300/80">
                        <p>© 2025 QuixHR Inc.</p>
                    </div>

                    {/* Abstract Background Shapes */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-600/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>
                </div>

                {/* Right Side - Onboarding Form */}
                <div className="flex-1 flex flex-col justify-center p-8 lg:p-12 bg-white relative">
                    <div className="w-full max-w-sm mx-auto space-y-8">
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-slate-900 text-white mb-4 lg:hidden">
                                <span className="font-bold text-sm">Q</span>
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Welcome to QuixHR</h2>
                            <p className="text-sm text-slate-500 mt-2">Create your organization to get started</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="orgName" className="text-slate-700">Organization Name</Label>
                                <Input
                                    id="orgName"
                                    type="text"
                                    placeholder="e.g. Acme Corp"
                                    value={orgName}
                                    onChange={(e) => setOrgName(e.target.value)}
                                    className="h-11 rounded-md border-slate-200 focus:ring-slate-900 focus:border-slate-900"
                                    required
                                />
                                <p className="text-xs text-slate-400">This will be your workspace name.</p>
                            </div>

                            {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-md font-medium">{error}</p>}

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-medium transition-all shadow-lg shadow-slate-900/10"
                            >
                                {isLoading ? "Creating..." : "Create Workspace"}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
