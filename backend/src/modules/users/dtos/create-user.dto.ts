import { Role } from '@prisma/client';

/**
 * Input DTO for creating a new user
 */
export interface CreateUserDto {
    email: string;
    name?: string;
    password: string;
    role?: Role;
    organizationId?: string;
}

/**
 * Validate create user request
 */
export function validateCreateUserDto(data: any): { valid: boolean; errors: string[] } {
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

    // Password validation
    if (!data.password || typeof data.password !== 'string') {
        errors.push('password is required and must be a string');
    } else if (data.password.length < 6) {
        errors.push('password must be at least 6 characters long');
    }

    // Name validation (optional)
    if (data.name !== undefined && typeof data.name !== 'string') {
        errors.push('name must be a string');
    }

    // Role validation (optional)
    if (data.role !== undefined && !Object.values(Role).includes(data.role)) {
        errors.push(`role must be one of: ${Object.values(Role).join(', ')}`);
    }

    // OrganizationId validation (optional)
    if (data.organizationId !== undefined && typeof data.organizationId !== 'string') {
        errors.push('organizationId must be a string');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
