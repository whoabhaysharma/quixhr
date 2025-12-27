import { Role } from '@prisma/client';

/**
 * Full user profile response (for self or admin view)
 * Excludes sensitive fields like password
 */
export interface UserResponseDto {
    id: string;
    email: string;
    name: string | null;
    avatar: string | null;
    role: Role;
    organizationId: string | null;
    holidayCalendarId: string | null;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Transform database User model to response DTO
 */
export function toUserResponseDto(user: {
    id: string;
    email: string;
    name: string | null;
    avatar: string | null;
    role: Role;
    organizationId: string | null;
    holidayCalendarId: string | null;
    createdAt: Date;
    updatedAt: Date;
}): UserResponseDto {
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        organizationId: user.organizationId,
        holidayCalendarId: user.holidayCalendarId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}
