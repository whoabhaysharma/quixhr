export interface CreateEmployeeDTO {
    firstName: string;
    lastName: string;
    code?: string;
    status: string;
    joiningDate: Date;
    calendarId?: string;
    leaveGradeId?: string;
}

export interface UpdateEmployeeDTO {
    firstName?: string;
    lastName?: string;
    code?: string;
    status?: string;
    joiningDate?: Date;
}

export interface AssignConfigDTO {
    calendarId?: string;
    leaveGradeId?: string;
}

export interface UpdateStatusDTO {
    status: string;
}

export interface EmployeeFilters {
    status?: string;
    dept?: string;
}

export interface ImportEmployeeRow {
    firstName: string;
    lastName: string;
    email: string;
    code?: string;
    joiningDate: string;
    status?: string;
}
