import { LeaveStatus, LeaveType, LedgerEvent, Role } from '@prisma/client';
import { TokenPayload } from '@/modules/auth/auth.types';

// ============================================================================
// INTERNAL TYPES (NOT for API responses)
// ============================================================================

/**
 * Authenticated user context extracted from JWT token
 */
export interface AuthContext extends TokenPayload {
  // Inherits all properties from TokenPayload
}

/**
 * Employee context for company validation
 */
export interface EmployeeContext {
  id: string;
  companyId: string;
  userId: string;
  role: Role;
}

/**
 * Pagination query parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Leave request filters
 */
export interface LeaveRequestFilters extends PaginationParams {
  employeeId?: string;
  status?: LeaveStatus;
  type?: LeaveType;
  startDate?: string;
  endDate?: string;
}

/**
 * Leave request creation data
 */
export interface LeaveRequestCreateData {
  startDate: Date;
  endDate: Date;
  type: LeaveType;
  reason?: string;
  dayDetails?: any; // JSON metadata for half-day logic
}

/**
 * Leave request update data (for approval/rejection)
 */
export interface LeaveRequestUpdateData {
  status: LeaveStatus;
  reason?: string; // For rejection reason
}

/**
 * Leave allocation data
 */
export interface LeaveAllocationData {
  employeeId: string;
  year: number;
  leaveType: LeaveType;
  allocated: number;
  used: number;
}

/**
 * Leave ledger entry data
 */
export interface LeaveLedgerData {
  employeeId: string;
  event: LedgerEvent;
  amount: number;
  remarks?: string;
  leaveRequestId?: string;
}

/**
 * Leave balance data
 */
export interface LeaveBalanceData {
  leaveType: LeaveType;
  allocated: number;
  used: number;
  remaining: number;
  carryForward?: number;
}