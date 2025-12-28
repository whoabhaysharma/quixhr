export interface CreateMemberDto {
    name: string;
    email: string;
    role?: string; // Optional, default to EMPLOYEE
    companyId: string;
    status?: string;
}

export interface UpdateMemberDto {
    name?: string;
    status?: string;
    role?: string;
}

export interface MemberResponseDto {
    id: string;
    userId: string;
    companyId: string;
    name: string;
    status: string;
    email?: string; // From User relation
    role?: string; // From User relation
    createdAt: Date;
}
