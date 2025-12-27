/**
 * Input DTO for creating a holiday calendar
 */
export interface CreateCalendarDto {
    name: string;
    description?: string;
    year: number;
}

/**
 * Validate create calendar request
 */
export function validateCreateCalendarDto(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || typeof data.name !== 'string') {
        errors.push('name is required and must be a string');
    } else if (data.name.trim().length < 2) {
        errors.push('name must be at least 2 characters long');
    }

    if (data.description !== undefined && typeof data.description !== 'string') {
        errors.push('description must be a string');
    }

    if (data.year === undefined || typeof data.year !== 'number') {
        errors.push('year is required and must be a number');
    } else {
        const currentYear = new Date().getFullYear();
        if (data.year < currentYear) {
            errors.push('year must be current year or future');
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
