export interface CreateEmployeeDto {
    name: string;
    email: string;
    role?: string; // Optional, default to EMPLOYEE
    companyId: string;
    status?: string;
}

export interface UpdateEmployeeDto {
    name?: string;
    status?: string;
    role?: string;
}

export interface EmployeeResponseDto {
    id: string;
    userId: string;
    companyId: string;
    name: string;
    status: string;
    email?: string; // From User relation
    role?: string; // From User relation
    createdAt: Date;
}
