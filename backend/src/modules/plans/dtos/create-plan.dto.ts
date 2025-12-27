/**
 * Input DTO for creating a new plan (admin only)
 */
export interface CreatePlanDto {
    name: string;
    price: number;
    durationDays: number;
    maxEmployees: number;
}

/**
 * Validate create plan request
 */
export function validateCreatePlanDto(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || typeof data.name !== 'string') {
        errors.push('name is required and must be a string');
    } else if (data.name.trim().length < 2) {
        errors.push('name must be at least 2 characters long');
    }

    if (data.price === undefined || typeof data.price !== 'number') {
        errors.push('price is required and must be a number');
    } else if (data.price < 0) {
        errors.push('price must be a positive number');
    }

    if (data.durationDays === undefined || typeof data.durationDays !== 'number') {
        errors.push('durationDays is required and must be a number');
    } else if (data.durationDays <= 0) {
        errors.push('durationDays must be a positive number');
    }

    if (data.maxEmployees === undefined || typeof data.maxEmployees !== 'number') {
        errors.push('maxEmployees is required and must be a number');
    } else if (data.maxEmployees <= 0) {
        errors.push('maxEmployees must be a positive number');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
