import AttendanceManagerView from "@/components/views/hr/AttendanceManagerView"
import ComingSoonView from "@/components/views/ComingSoonView"

const COMING_SOON = true

export default function ManageAttendancePage() {
    if (COMING_SOON) {
        return <ComingSoonView
            title="Attendance Management"
            description="Manage employee attendance, regularize requests, and view daily reports. This feature is currently under development."
        />
    }
    return <AttendanceManagerView />
}
