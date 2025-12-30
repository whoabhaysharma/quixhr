export interface CompanyProfileDTO {
    name?: string;
    timezone?: string;
    currency?: string;
    dateFormat?: string;
    logoUrl?: string;
}

export interface UpdateCompanyDTO {
    logoUrl?: string;
    currency?: string;
    timezone?: string;
    dateFormat?: string;
}

export interface DashboardStats {
    headcount: {
        total: number;
        active: number;
        inactive: number;
    };
    todayAttendance: {
        present: number;
        absent: number;
        onLeave: number;
        notMarked: number;
    };
    pendingLeaves: {
        count: number;
        requests: Array<{
            id: string;
            employeeName: string;
            leaveType: string;
            startDate: Date;
            endDate: Date;
            daysTaken: number;
        }>;
    };
}

export interface UpdateUserRoleDTO {
    role: string;
}
