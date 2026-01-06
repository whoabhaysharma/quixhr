export interface AuthContext {
    userId: string;
    email: string;
    role: string;
    employeeId?: string;
    organizationId?: string;
}

export interface EmployeeContext {
    id: string;
    organizationId: string;
    userId: string;
    firstName: string;
    lastName: string;
    leaveGradeId?: string;
    calendarId?: string;
}
