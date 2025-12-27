/**
 * Input DTO for accepting an invitation
 */
export interface AcceptInviteDto {
    token: string;
    name: string;
    password: string;
}

/**
 * Validate accept invite request
 */
export function validateAcceptInviteDto(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.token || typeof data.token !== 'string') {
        errors.push('token is required and must be a string');
    }

    if (!data.name || typeof data.name !== 'string') {
        errors.push('name is required and must be a string');
    } else if (data.name.trim().length < 2) {
        errors.push('name must be at least 2 characters long');
    }

    if (!data.password || typeof data.password !== 'string') {
        errors.push('password is required and must be a string');
    } else if (data.password.length < 6) {
        errors.push('password must be at least 6 characters long');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
