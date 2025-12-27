/**
 * Input DTO for adding a holiday
 */
export interface CreateHolidayDto {
    name: string;
    date: string; // ISO date string
    endDate?: string; // ISO date string
    description?: string;
    calendarId: string;
}

/**
 * Validate create holiday request
 */
export function validateCreateHolidayDto(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || typeof data.name !== 'string') {
        errors.push('name is required and must be a string');
    } else if (data.name.trim().length < 2) {
        errors.push('name must be at least 2 characters long');
    }

    if (!data.date || typeof data.date !== 'string') {
        errors.push('date is required and must be a valid date string');
    } else {
        const date = new Date(data.date);
        if (isNaN(date.getTime())) {
            errors.push('date must be a valid date');
        }
    }

    if (data.endDate !== undefined) {
        if (typeof data.endDate !== 'string') {
            errors.push('endDate must be a string');
        } else {
            const endDate = new Date(data.endDate);
            if (isNaN(endDate.getTime())) {
                errors.push('endDate must be a valid date');
            } else if (data.date) {
                const startDate = new Date(data.date);
                if (endDate <= startDate) {
                    errors.push('endDate must be after date');
                }
            }
        }
    }

    if (data.description !== undefined && typeof data.description !== 'string') {
        errors.push('description must be a string');
    }

    if (!data.calendarId || typeof data.calendarId !== 'string') {
        errors.push('calendarId is required and must be a string');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
