/**
 * Input DTO for clocking out
 */
export interface ClockOutDto {
    attendanceId: string;
}

/**
 * Validate clock out request
 */
export function validateClockOutDto(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.attendanceId || typeof data.attendanceId !== 'string') {
        errors.push('attendanceId is required and must be a string (UUID)');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
