/**
 * Input DTO for clocking in
 */
export interface ClockInDto {
    date?: string; // ISO date string, defaults to today
}

/**
 * Validate clock in request
 */
export function validateClockInDto(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (data.date !== undefined) {
        if (typeof data.date !== 'string') {
            errors.push('date must be a string');
        } else {
            const date = new Date(data.date);
            if (isNaN(date.getTime())) {
                errors.push('date must be a valid date string');
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
