import { AttendanceStatus } from '@prisma/client';

/**
 * Input DTO for manual attendance update (admin)
 */
export interface UpdateAttendanceDto {
    status: AttendanceStatus;
    clockIn?: string; // ISO datetime string
    clockOut?: string; // ISO datetime string
}

/**
 * Validate update attendance request
 */
export function validateUpdateAttendanceDto(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.status) {
        errors.push('status is required');
    } else if (!Object.values(AttendanceStatus).includes(data.status)) {
        errors.push(`status must be one of: ${Object.values(AttendanceStatus).join(', ')}`);
    }

    if (data.clockIn !== undefined) {
        if (typeof data.clockIn !== 'string') {
            errors.push('clockIn must be a string');
        } else {
            const date = new Date(data.clockIn);
            if (isNaN(date.getTime())) {
                errors.push('clockIn must be a valid datetime string');
            }
        }
    }

    if (data.clockOut !== undefined) {
        if (typeof data.clockOut !== 'string') {
            errors.push('clockOut must be a string');
        } else {
            const date = new Date(data.clockOut);
            if (isNaN(date.getTime())) {
                errors.push('clockOut must be a valid datetime string');
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
