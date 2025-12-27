import { Role } from '@prisma/client';

/**
 * Invitation details response (token excluded for security)
 */
export interface InviteResponseDto {
    id: string;
    email: string;
    role: Role;
    organizationId: string;
    expiresAt: Date;
    acceptedAt: Date | null;
    createdAt: Date;
}

/**
 * Transform database Invite model to response DTO
 */
export function toInviteResponseDto(invite: {
    id: string;
    email: string;
    role: Role;
    organizationId: string;
    expiresAt: Date;
    acceptedAt: Date | null;
    createdAt: Date;
}): InviteResponseDto {
    return {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        organizationId: invite.organizationId,
        expiresAt: invite.expiresAt,
        acceptedAt: invite.acceptedAt,
        createdAt: invite.createdAt,
    };
}
