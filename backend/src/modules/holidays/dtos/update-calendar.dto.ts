/**
 * Input DTO for updating a holiday calendar
 */
export interface UpdateCalendarDto {
    name?: string;
    description?: string;
}

/**
 * Validate update calendar request
 */
export function validateUpdateCalendarDto(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (data.name !== undefined) {
        if (typeof data.name !== 'string') {
            errors.push('name must be a string');
        } else if (data.name.trim().length < 2) {
            errors.push('name must be at least 2 characters long');
        }
    }

    if (data.description !== undefined && typeof data.description !== 'string') {
        errors.push('description must be a string');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
