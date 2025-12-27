/**
 * Input DTO for updating a holiday
 */
export interface UpdateHolidayDto {
    name?: string;
    date?: string; // ISO date string
    endDate?: string; // ISO date string
    description?: string;
}

/**
 * Validate update holiday request
 */
export function validateUpdateHolidayDto(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (data.name !== undefined) {
        if (typeof data.name !== 'string') {
            errors.push('name must be a string');
        } else if (data.name.trim().length < 2) {
            errors.push('name must be at least 2 characters long');
        }
    }

    if (data.date !== undefined) {
        if (typeof data.date !== 'string') {
            errors.push('date must be a string');
        } else {
            const date = new Date(data.date);
            if (isNaN(date.getTime())) {
                errors.push('date must be a valid date');
            }
        }
    }

    if (data.endDate !== undefined) {
        if (typeof data.endDate !== 'string') {
            errors.push('endDate must be a string');
        } else {
            const endDate = new Date(data.endDate);
            if (isNaN(endDate.getTime())) {
                errors.push('endDate must be a valid date');
            }
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
