import { LeaveStatus } from '@prisma/client';

/**
 * Input DTO for updating leave status
 */
export interface UpdateLeaveStatusDto {
    status: LeaveStatus;
    adminNotes?: string;
}

/**
 * Validate update leave status request
 */
export function validateUpdateLeaveStatusDto(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.status) {
        errors.push('status is required');
    } else if (!Object.values(LeaveStatus).includes(data.status)) {
        errors.push(`status must be one of: ${Object.values(LeaveStatus).join(', ')}`);
    }

    if (data.adminNotes !== undefined && typeof data.adminNotes !== 'string') {
        errors.push('adminNotes must be a string');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
