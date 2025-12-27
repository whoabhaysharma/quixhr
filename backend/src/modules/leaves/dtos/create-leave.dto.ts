/**
 * Input DTO for creating a leave request
 */
export interface CreateLeaveDto {
    type: string; // Frontend sends: 'Vacation', 'Sick', 'Personal'
    startDate: string; // ISO date string
    endDate: string; // ISO date string
    reason?: string;
    customDates?: string[]; // Array of ISO date strings for custom date selection
}

/**
 * Validate create leave request
 */
export function validateCreateLeaveDto(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.type || typeof data.type !== 'string') {
        errors.push('type is required and must be a string');
    }

    if (!data.startDate || typeof data.startDate !== 'string') {
        errors.push('startDate is required and must be a valid date string');
    } else {
        const startDate = new Date(data.startDate);
        if (isNaN(startDate.getTime())) {
            errors.push('startDate must be a valid date');
        }
    }

    if (!data.endDate || typeof data.endDate !== 'string') {
        errors.push('endDate is required and must be a valid date string');
    } else {
        const endDate = new Date(data.endDate);
        if (isNaN(endDate.getTime())) {
            errors.push('endDate must be a valid date');
        }
    }

    if (data.reason !== undefined && typeof data.reason !== 'string') {
        errors.push('reason must be a string');
    }

    if (data.customDates !== undefined) {
        if (!Array.isArray(data.customDates)) {
            errors.push('customDates must be an array');
        } else {
            for (const date of data.customDates) {
                if (typeof date !== 'string' || isNaN(new Date(date).getTime())) {
                    errors.push('customDates must contain valid date strings');
                    break;
                }
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
