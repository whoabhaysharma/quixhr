export interface CreateCompanyDto {
    name: string;
    timezone?: string;
}

export interface UpdateCompanyDto {
    name?: string;
    timezone?: string;
}

export interface CompanyResponseDto {
    id: string;
    name: string;
    timezone: string;
    _count?: {
        employees: number;
    };
}
