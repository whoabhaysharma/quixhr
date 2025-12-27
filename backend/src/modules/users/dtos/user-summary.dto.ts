import { Role } from '@prisma/client';

/**
 * Safe user representation without sensitive fields
 * Used in API responses to prevent password/internal data exposure
 */
export interface UserSummaryDto {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
    role: Role;
}

/**
 * Transform database User model to safe DTO
 */
export function toUserSummaryDto(user: {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
    role: Role;
}): UserSummaryDto {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
    };
}
