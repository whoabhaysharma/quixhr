import AttendanceView from "@/components/views/employee/AttendanceView"
import ComingSoonView from "@/components/views/ComingSoonView"

const COMING_SOON = true

export default function AttendancePage() {
    if (COMING_SOON) {
        return <ComingSoonView
            title="Attendance Management"
            description="Track your daily work hours, check-ins, and view your attendance history. This feature is currently under development."
        />
    }
    return <AttendanceView />
}
