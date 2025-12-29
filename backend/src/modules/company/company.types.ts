export interface CompanySettingsDTO {
    timezone?: string;
    currency?: string;
    dateFormat?: string;
    logoUrl?: string;
}

export interface InviteUserDTO {
    email: string;
    role: string;
}

export interface UpdateUserRoleDTO {
    role: string;
}

export interface InvitationFilters {
    status?: string;
}
