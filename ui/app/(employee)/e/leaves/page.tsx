"use client"

import LeavesView from "@/components/views/employee/LeavesView"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Spinner } from "@/components/ui/spinner"

export default function LeavesPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading && user?.user?.role !== 'EMPLOYEE') {
            router.push("/manage/leaves")
        }
    }, [user, isLoading, router])

    if (isLoading || user?.user?.role !== 'EMPLOYEE') {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <Spinner />
            </div>
        )
    }

    return <LeavesView />
}
