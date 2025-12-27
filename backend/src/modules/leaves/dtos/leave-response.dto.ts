import { LeaveType, LeaveStatus } from '@prisma/client';
import { UserSummaryDto } from '../users/dtos/user-summary.dto';

/**
 * Complete leave response with sanitized user data
 */
export interface LeaveResponseDto {
    id: string;
    userId: string;
    type: LeaveType;
    startDate: Date;
    endDate: Date;
    totalDays: number;
    reason: string | null;
    status: LeaveStatus;
    adminNotes: string | null;
    user?: UserSummaryDto;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Transform database Leave model to response DTO
 */
export function toLeaveResponseDto(leave: {
    id: string;
    userId: string;
    type: LeaveType;
    startDate: Date;
    endDate: Date;
    totalDays: number;
    reason: string | null;
    status: LeaveStatus;
    adminNotes: string | null;
    createdAt: Date;
    updatedAt: Date;
    user?: {
        id: string;
        name: string | null;
        email: string;
        avatar: string | null;
        role: any;
    };
}): LeaveResponseDto {
    return {
        id: leave.id,
        userId: leave.userId,
        type: leave.type,
        startDate: leave.startDate,
        endDate: leave.endDate,
        totalDays: leave.totalDays,
        reason: leave.reason,
        status: leave.status,
        adminNotes: leave.adminNotes,
        user: leave.user ? {
            id: leave.user.id,
            name: leave.user.name,
            email: leave.user.email,
            avatar: leave.user.avatar,
            role: leave.user.role,
        } : undefined,
        createdAt: leave.createdAt,
        updatedAt: leave.updatedAt,
    };
}
