import { Role } from '@prisma/client';

/**
 * Input DTO for sending an invitation
 */
export interface CreateInviteDto {
    email: string;
    role: Role;
}

/**
 * Validate create invite request
 */
export function validateCreateInviteDto(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Email validation
    if (!data.email || typeof data.email !== 'string') {
        errors.push('email is required and must be a string');
    } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            errors.push('email must be a valid email address');
        }
    }

    // Role validation
    if (!data.role) {
        errors.push('role is required');
    } else if (!Object.values(Role).includes(data.role)) {
        errors.push(`role must be one of: ${Object.values(Role).join(', ')}`);
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
