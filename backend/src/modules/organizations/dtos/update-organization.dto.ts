/**
 * Input DTO for updating an organization
 */
export interface UpdateOrganizationDto {
    name?: string;
}

/**
 * Validate update organization request
 */
export function validateUpdateOrganizationDto(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (data.name !== undefined) {
        if (typeof data.name !== 'string') {
            errors.push('name must be a string');
        } else if (data.name.trim().length < 2) {
            errors.push('name must be at least 2 characters long');
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
