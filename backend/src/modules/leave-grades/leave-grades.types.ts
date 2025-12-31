import { LeaveType, Role } from '@prisma/client';
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
 * Pagination query parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Leave grade filters
 */
export interface LeaveGradeFilters extends PaginationParams {
  name?: string;
}

/**
 * Leave grade creation data
 */
export interface LeaveGradeCreateData {
  name: string;
  policies: Array<{
    leaveType: LeaveType;
    totalDays: number;
    carryForward: boolean;
    maxCarryAmount?: number;
  }>;
}

/**
 * Leave grade update data
 */
export interface LeaveGradeUpdateData {
  name?: string;
  policies?: Array<{
    leaveType: LeaveType;
    totalDays: number;
    carryForward: boolean;
    maxCarryAmount?: number;
  }>;
}

/**
 * Leave policy data
 */
export interface LeavePolicyData {
  id: string;
  leaveGradeId: string;
  leaveType: LeaveType;
  totalDays: number;
  carryForward: boolean;
  maxCarryAmount: number;
}

/**
 * Leave grade data from database
 */
export interface LeaveGradeData {
  id: string;
  companyId: string;
  name: string;
  policies: LeavePolicyData[];
  employeeCount?: number;
}