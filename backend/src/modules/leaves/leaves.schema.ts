import { z } from 'zod';
import { LeaveStatus, LeaveType, LedgerEvent } from '@prisma/client';

// =========================================================================
// REQUEST VALIDATION SCHEMAS
// =========================================================================

/**
 * Schema for creating a new leave request
 */
export const createLeaveRequestSchema = {
  body: z.object({
    startDate: z.string().datetime().or(z.date()),
    endDate: z.string().datetime().or(z.date()),
    type: z.nativeEnum(LeaveType),
    reason: z.string().max(500).optional(),
    dayDetails: z.any().optional(), // JSON metadata for half-day logic
  }),
  params: z.object({
    companyId: z.string().uuid('Invalid company ID'),
  }),
};

/**
 * Schema for updating leave request status (approval/rejection)
 */
export const updateLeaveRequestSchema = {
  body: z.object({
    status: z.nativeEnum(LeaveStatus),
    reason: z.string().max(500).optional(), // For rejection reason
  }),
  params: z.object({
    companyId: z.string().uuid('Invalid company ID'),
    leaveRequestId: z.string().uuid('Invalid leave request ID'),
  }),
};

/**
 * Schema for getting leave request by ID
 */
export const getLeaveRequestSchema = {
  params: z.object({
    companyId: z.string().uuid('Invalid company ID'),
    leaveRequestId: z.string().uuid('Invalid leave request ID'),
  }),
};

/**
 * Schema for listing leave requests
 */
export const getLeaveRequestsSchema = {
  params: z.object({
    companyId: z.string().uuid('Invalid company ID'),
  }),
  query: z.object({
    page: z.coerce.number().min(1).default(1).optional(),
    limit: z.coerce.number().min(1).max(100).default(20).optional(),
    employeeId: z.string().uuid().optional(),
    status: z.nativeEnum(LeaveStatus).optional(),
    type: z.nativeEnum(LeaveType).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
};

/**
 * Schema for getting employee leave balances
 */
export const getLeaveBalancesSchema = {
  params: z.object({
    companyId: z.string().uuid('Invalid company ID'),
    employeeId: z.string().uuid('Invalid employee ID'),
  }),
  query: z.object({
    year: z.coerce.number().min(2000).max(3000).optional(),
  }),
};

/**
 * Schema for manually adjusting leave balance
 */
export const adjustLeaveBalanceSchema = {
  body: z.object({
    leaveType: z.nativeEnum(LeaveType),
    amount: z.number(),
    remarks: z.string().max(500),
  }),
  params: z.object({
    companyId: z.string().uuid('Invalid company ID'),
    employeeId: z.string().uuid('Invalid employee ID'),
  }),
};

// =========================================================================
// RESPONSE DTOs
// =========================================================================

/**
 * Leave request response DTO
 */
export interface LeaveRequestResponseDto {
  success: boolean;
  message: string;
  data: {
    id: string;
    employeeId: string;
    employeeName: string;
    startDate: Date;
    endDate: Date;
    daysTaken: number;
    type: LeaveType;
    status: LeaveStatus;
    reason?: string;
    dayDetails?: any;
    approvedBy?: string;
    approverName?: string;
    createdAt: Date;
  };
}

/**
 * Leave requests list response DTO
 */
export interface LeaveRequestsListResponseDto {
  success: boolean;
  message: string;
  data: {
    leaveRequests: Array<{
      id: string;
      employeeId: string;
      employeeName: string;
      startDate: Date;
      endDate: Date;
      daysTaken: number;
      type: LeaveType;
      status: LeaveStatus;
      reason?: string;
      dayDetails?: any;
      approvedBy?: string;
      approverName?: string;
      createdAt: Date;
    }>;
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

/**
 * Leave balances response DTO
 */
export interface LeaveBalancesResponseDto {
  success: boolean;
  message: string;
  data: {
    employeeId: string;
    employeeName: string;
    year: number;
    balances: Array<{
      leaveType: LeaveType;
      allocated: number;
      used: number;
      remaining: number;
      carryForward?: number;
    }>;
  };
}

/**
 * Leave adjustment response DTO
 */
export interface LeaveAdjustmentResponseDto {
  success: boolean;
  message: string;
  data: {
    employeeId: string;
    leaveType: LeaveType;
    amount: number;
    newBalance: number;
    remarks: string;
  };
}

/**
 * Leave statistics response DTO
 */
export interface LeaveStatsResponseDto {
  success: boolean;
  message: string;
  data: {
    totalRequests: number;
    pendingRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
    totalDaysTaken: number;
    byType: Array<{
      type: LeaveType;
      count: number;
      days: number;
    }>;
    byMonth: Array<{
      month: string;
      count: number;
      days: number;
    }>;
  };
}

// =========================================================================
// TYPE EXPORTS FOR REQUEST VALIDATION
// =========================================================================

export type CreateLeaveRequestDto = z.infer<typeof createLeaveRequestSchema.body>;
export type UpdateLeaveRequestDto = z.infer<typeof updateLeaveRequestSchema.body>;
export type GetLeaveRequestParamsDto = z.infer<typeof getLeaveRequestSchema.params>;
export type GetLeaveRequestsQueryDto = z.infer<typeof getLeaveRequestsSchema.query>;
export type GetLeaveBalancesParamsDto = z.infer<typeof getLeaveBalancesSchema.params>;
export type AdjustLeaveBalanceDto = z.infer<typeof adjustLeaveBalanceSchema.body>;