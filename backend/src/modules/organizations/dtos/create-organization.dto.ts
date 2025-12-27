/**
 * Input DTO for creating a new organization
 */
export interface CreateOrganizationDto {
    name: string;
}

/**
 * Validate create organization request
 */
export function validateCreateOrganizationDto(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || typeof data.name !== 'string') {
        errors.push('name is required and must be a string');
    } else if (data.name.trim().length < 2) {
        errors.push('name must be at least 2 characters long');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
