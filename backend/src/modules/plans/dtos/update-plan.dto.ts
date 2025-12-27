/**
 * Input DTO for updating a plan
 */
export interface UpdatePlanDto {
    name?: string;
    price?: number;
    durationDays?: number;
    maxEmployees?: number;
}

/**
 * Validate update plan request
 */
export function validateUpdatePlanDto(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (data.name !== undefined) {
        if (typeof data.name !== 'string') {
            errors.push('name must be a string');
        } else if (data.name.trim().length < 2) {
            errors.push('name must be at least 2 characters long');
        }
    }

    if (data.price !== undefined) {
        if (typeof data.price !== 'number') {
            errors.push('price must be a number');
        } else if (data.price < 0) {
            errors.push('price must be a positive number');
        }
    }

    if (data.durationDays !== undefined) {
        if (typeof data.durationDays !== 'number') {
            errors.push('durationDays must be a number');
        } else if (data.durationDays <= 0) {
            errors.push('durationDays must be a positive number');
        }
    }

    if (data.maxEmployees !== undefined) {
        if (typeof data.maxEmployees !== 'number') {
            errors.push('maxEmployees must be a number');
        } else if (data.maxEmployees <= 0) {
            errors.push('maxEmployees must be a positive number');
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
