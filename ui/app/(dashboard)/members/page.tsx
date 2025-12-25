import { redirect } from "next/navigation"

export default function MembersPage() {
    // Redirect to manage page since members is a management feature
    redirect("/manage/members")
}
