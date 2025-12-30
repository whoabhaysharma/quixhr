import { Role } from '@prisma/client';

export interface SendInvitationDTO {
    email: string;
    role: Role;
}

export interface InvitationFilters {
    status?: string;
}

export interface AcceptInvitationDTO {
    token: string;
    firstName: string;
    lastName: string;
    password: string;
}

export interface ValidateTokenResponse {
    valid: boolean;
    invitation?: {
        email: string;
        role: Role;
        companyName: string;
        expiresAt: Date;
    };
    error?: string;
}
