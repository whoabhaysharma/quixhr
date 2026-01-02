"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Plus } from "lucide-react"

export default function PlansPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Subscription Plans</h2>
                    <p className="text-muted-foreground mt-1">Manage pricing tiers and features.</p>
                </div>
                <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" /> Create Plan
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Starter Plan */}
                <Card>
                    <CardHeader>
                        <CardTitle>Starter</CardTitle>
                        <CardDescription>Perfect for small teams</CardDescription>
                        <div className="mt-4">
                            <span className="text-3xl font-bold">$29</span>
                            <span className="text-muted-foreground">/mo</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Up to 10 Employees</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Basic Attendance</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Leave Management</li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" variant="outline">Edit Plan</Button>
                    </CardFooter>
                </Card>

                {/* Pro Plan */}
                <Card className="border-indigo-600 shadow-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg uppercase">Popular</div>
                    <CardHeader>
                        <CardTitle className="text-indigo-600">Pro</CardTitle>
                        <CardDescription>For growing organizations</CardDescription>
                        <div className="mt-4">
                            <span className="text-3xl font-bold">$99</span>
                            <span className="text-muted-foreground">/mo</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-600" /> Up to 50 Employees</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-600" /> Advanced Analytics</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-600" /> Document Storage</li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700">Edit Plan</Button>
                    </CardFooter>
                </Card>

                {/* Enterprise Plan */}
                <Card>
                    <CardHeader>
                        <CardTitle>Enterprise</CardTitle>
                        <CardDescription>Custom solutions</CardDescription>
                        <div className="mt-4">
                            <span className="text-3xl font-bold">$299</span>
                            <span className="text-muted-foreground">/mo</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Unlimited Employees</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Custom Integrations</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> 24/7 Support</li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" variant="outline">Edit Plan</Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
