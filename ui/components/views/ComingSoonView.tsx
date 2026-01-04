"use client"

import { Button } from "@/components/ui/button"
import { Construction, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface ComingSoonViewProps {
    title?: string;
    description?: string;
    backLink?: string;
    backText?: string;
}

export default function ComingSoonView({
    title = "Coming Soon",
    description = "We are working hard to bring you this feature. Please check back later.",
    backLink = "/e/dashboard",
    backText = "Back to Dashboard"
}: ComingSoonViewProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                <Construction className="w-10 h-10 text-indigo-600" />
            </div>

            <h1 className="text-3xl font-bold text-slate-900 mb-3">{title}</h1>
            <p className="text-slate-500 max-w-md mb-8 text-lg">
                {description}
            </p>

            <Link href={backLink}>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 h-11 px-8">
                    <ArrowLeft className="w-4 h-4" />
                    {backText}
                </Button>
            </Link>
        </div>
    )
}
