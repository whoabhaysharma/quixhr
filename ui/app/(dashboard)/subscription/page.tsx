"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Loader2 } from "lucide-react"
import { toast } from 'sonner'
import { loadRazorpay } from '@/lib/razorpay'
import { subscriptionService } from '@/lib/services/subscription'
import { useAuth } from '@/context/auth-context'
import { useRouter } from 'next/navigation'

const plans = [
    {
        id: 'plan_basic', // This should match your DB plan IDs
        name: 'Basic',
        price: 999, // INR
        currency: '₹',
        description: 'Perfect for small teams getting started.',
        features: [
            'Up to 10 employees',
            'Basic attendance tracking',
            'Leave management',
            'Email support'
        ]
    },
    {
        id: 'plan_pro',
        name: 'Pro',
        price: 2499,
        currency: '₹',
        description: 'Advanced features for growing organizations.',
        features: [
            'Up to 50 employees',
            'Advanced reporting',
            'Holiday calendars',
            'Priority support',
            'Payroll integration'
        ],
        popular: true
    }
]

export default function SubscriptionPage() {
    const [loading, setLoading] = useState<string | null>(null)
    const { user } = useAuth()
    const router = useRouter()

    const handleSubscribe = async (plan: typeof plans[0]) => {
        try {
            setLoading(plan.id)

            const isLoaded = await loadRazorpay()
            if (!isLoaded) {
                toast.error('Razorpay SDK failed to load. Are you online?')
                setLoading(null)
                return
            }

            // 1. Create Order
            const { order } = await subscriptionService.createOrder(plan.id)

            // 2. Open Razorpay Checkout
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Enter the Key ID generated from the Dashboard
                amount: order.amount,
                currency: order.currency,
                name: "QuixHR",
                description: `Subscription to ${plan.name} Plan`,
                order_id: order.id,
                handler: async function (response: any) {
                    try {
                        // Webhook handles verification
                        toast.success('Payment successful! Activating subscription...')
                        // Optimistic redirect
                        router.push('/dashboard')
                    } catch (error) {
                        // Should not happen as we just redirect
                        toast.error('Something went wrong. Please check your dashboard.')
                    }
                },
                prefill: {
                    name: user?.name,
                    email: user?.email,
                    contact: user?.mobile // If you have mobile
                },
                theme: {
                    color: "#0F172A"
                }
            };

            const paymentObject = new (window as any).Razorpay(options);
            paymentObject.open();

        } catch (error) {
            console.error(error)
            toast.error('Failed to initiate subscription. Please try again.')
        } finally {
            setLoading(null)
        }
    }

    return (
        <div className="container mx-auto py-10 px-4">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Simple, Transparent Pricing</h1>
                <p className="text-muted-foreground">Choose the plan that fits your organization.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {plans.map((plan) => (
                    <Card key={plan.id} className={`flex flex-col relative ${plan.popular ? 'border-primary border-2 shadow-lg' : ''}`}>
                        {plan.popular && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                Most Popular
                            </div>
                        )}
                        <CardHeader>
                            <CardTitle className="text-2xl">{plan.name}</CardTitle>
                            <CardDescription>{plan.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <div className="mb-6">
                                <span className="text-4xl font-bold">{plan.currency}{plan.price}</span>
                                <span className="text-muted-foreground">/month</span>
                            </div>
                            <ul className="space-y-3 text-sm">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-green-500" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button
                                className="w-full"
                                size="lg"
                                variant={plan.popular ? "default" : "outline"}
                                disabled={loading === plan.id}
                                onClick={() => handleSubscribe(plan)}
                            >
                                {loading === plan.id ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    `Subscribe to ${plan.name}`
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}
