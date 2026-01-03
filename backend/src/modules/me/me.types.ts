import { Role } from '@prisma/client';

export interface AuthContext {
    userId: string;
    email: string;
    role: Role;
    employeeId?: string;
    organizationId?: string;
}

export interface EmployeeContext {
    id: string; // Used as employee.id
    employeeId: string; // Some might use this, checking usage
    userId?: string;
    firstName?: string;
    lastName?: string;
    organizationId: string;
    leaveGradeId?: string | null;
    calendarId?: string | null;
}
