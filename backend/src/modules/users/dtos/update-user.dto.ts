/**
 * Input DTO for updating user profile
 */
export interface UpdateUserDto {
    name?: string;
    avatar?: string;
    holidayCalendarId?: string;
}

/**
 * Validate update user request
 */
export function validateUpdateUserDto(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Name validation (optional)
    if (data.name !== undefined) {
        if (typeof data.name !== 'string') {
            errors.push('name must be a string');
        } else if (data.name.trim().length < 2) {
            errors.push('name must be at least 2 characters long');
        }
    }

    // Avatar validation (optional)
    if (data.avatar !== undefined && typeof data.avatar !== 'string') {
        errors.push('avatar must be a string (URL)');
    }

    // HolidayCalendarId validation (optional)
    if (data.holidayCalendarId !== undefined && typeof data.holidayCalendarId !== 'string') {
        errors.push('holidayCalendarId must be a string');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
