import { z } from 'zod';
import { Role, LeaveType, LeaveStatus, AttendanceStatus } from '@prisma/client';

// =========================================================================
// VALIDATION SCHEMAS & REQUEST DTOs (Inferred from Schemas)
// =========================================================================

/**
 * Update user profile schema
 */
/**
 * Update user profile schema
 */
export const updateUserProfileSchema = {
  body: z.object({
    email: z.string().email('Invalid email format').optional(),
    isEmailVerified: z.boolean().optional(),
  }),
};

export type UpdateUserProfileRequestDto = z.infer<typeof updateUserProfileSchema.body>;

/**
 * Check-in schema
 */
export const checkInSchema = {
  body: z.object({
    method: z.string().optional(), // "WEB", "MOBILE", "BIOMETRIC"
    gpsCoords: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }).optional(),
  }),
};

export type CheckInRequestDto = z.infer<typeof checkInSchema.body>;

/**
 * Check-out schema
 */
export const checkOutSchema = {
  body: z.object({
    method: z.string().optional(),
    gpsCoords: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }).optional(),
  }),
};

export type CheckOutRequestDto = z.infer<typeof checkOutSchema.body>;

/**
 * Leave request schema
 */
export const leaveRequestSchema = {
  body: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    type: z.nativeEnum(LeaveType),
    reason: z.string().optional(),
    dayDetails: z.record(z.string(), z.any()).optional(),
  }),
};

export type LeaveRequestRequestDto = z.infer<typeof leaveRequestSchema.body>;



// =========================================================================
// RESPONSE DTOs (Manual Interfaces - we trust our own backend)
// =========================================================================

/**
 * User profile response DTO
 */
export interface UserProfileResponseDto {
  id: string;
  email: string;
  role: Role;
  isEmailVerified: boolean;
}

/**
 * Employee profile response DTO
 */
export interface EmployeeProfileResponseDto {
  id: string;
  companyId: string;
  userId: string;
  firstName: string;
  lastName: string;
  code?: string;
  status: string;
  joiningDate: Date;
  calendarId?: string;
  leaveGradeId?: string;
}

/**
 * Company profile response DTO
 */
export interface CompanyProfileResponseDto {
  id: string;
  name: string;
  timezone: string;
  currency: string;
  dateFormat: string;
  logoUrl?: string;
  createdAt: Date;
}

/**
 * Complete user profile response DTO
 */
export interface CompleteProfileResponseDto {
  user: UserProfileResponseDto;
  employee?: EmployeeProfileResponseDto;
  company?: CompanyProfileResponseDto;
}

/**
 * Notification response DTO
 */
export interface NotificationResponseDto {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

/**
 * Notifications list response DTO
 */
export interface NotificationsListResponseDto {
  notifications: NotificationResponseDto[];
  total: number;
  unreadCount: number;
}

/**
 * Audit log response DTO
 */
export interface AuditLogResponseDto {
  id: string;
  action: string;
  resource: string;
  resourceId: string;
  details?: any;
  ipAddress?: string;
  createdAt: Date;
}

/**
 * Audit logs list response DTO
 */
export interface AuditLogsListResponseDto {
  logs: AuditLogResponseDto[];
  total: number;
}

// =========================================================================
// LEAVE & ATTENDANCE RESPONSE DTOs
// =========================================================================

/**
 * Leave policy response DTO
 */
export interface LeavePolicyResponseDto {
  id: string;
  leaveType: LeaveType;
  totalDays: number;
  carryForward: boolean;
  maxCarryAmount: number;
}

/**
 * My leaves response DTO (policies for my grade)
 */
export interface MyLeavesResponseDto {
  gradeId: string;
  gradeName: string;
  policies: LeavePolicyResponseDto[];
}

/**
 * Leave allocation response DTO (balance)
 */
export interface LeaveAllocationResponseDto {
  id: string;
  year: number;
  leaveType: LeaveType;
  allocated: number;
  used: number;
  remaining: number;
}

/**
 * My leave balance response DTO
 */
export interface MyLeaveBalanceResponseDto {
  year: number;
  allocations: LeaveAllocationResponseDto[];
  total: number;
}

/**
 * Leave ledger entry response DTO
 */
export interface LeaveLedgerEntryResponseDto {
  id: string;
  createdAt: Date;
  event: string;
  amount: number;
  remarks?: string;
  leaveRequestId?: string;
}

/**
 * My leave ledger response DTO
 */
export interface MyLeaveLedgerResponseDto {
  entries: LeaveLedgerEntryResponseDto[];
  total: number;
}

/**
 * Leave request response DTO
 */
export interface LeaveRequestResponseDto {
  id: string;
  startDate: Date;
  endDate: Date;
  daysTaken: number;
  type: LeaveType;
  status: LeaveStatus;
  reason?: string;
  dayDetails?: any;
  approvedBy?: string;
  createdAt: Date;
}

/**
 * My leave requests response DTO
 */
export interface MyLeaveRequestsResponseDto {
  requests: LeaveRequestResponseDto[];
  total: number;
}

/**
 * Attendance response DTO
 */
export interface AttendanceResponseDto {
  id: string;
  date: Date;
  status: AttendanceStatus;
  checkIn?: Date;
  checkOut?: Date;
  workMinutes: number;
  overtimeMins: number;
  isLate: boolean;
  isEarlyOut: boolean;
}

/**
 * My attendance response DTO
 */
export interface MyAttendanceResponseDto {
  records: AttendanceResponseDto[];
  total: number;
}

/**
 * Check-in/Check-out response DTO
 */
export interface CheckInOutResponseDto {
  id: string;
  date: Date;
  status: AttendanceStatus;
  checkIn?: Date;
  checkOut?: Date;
  workMinutes: number;
  isLate: boolean;
}
