import { Role } from '@prisma/client';
import { TokenPayload } from '@/modules/auth/auth.types';

// ============================================================================
// INTERNAL TYPES (NOT for API responses)
// ============================================================================

/**
 * Authenticated user context extracted from JWT token
 * Uses the same TokenPayload as the auth module for consistency
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
 * Employee filters
 */
export interface EmployeeFilters extends PaginationParams {
  search?: string;
  status?: string;
  calendarId?: string;
  leaveGradeId?: string;
}

/**
 * Employee details from database
 */
export interface EmployeeData {
  id: string;
  companyId: string;
  userId?: string;
  calendarId?: string;
  leaveGradeId?: string;
  firstName: string;
  lastName: string;
  code?: string;
  status: string;
  joiningDate: Date;
  user?: {
    id: string;
    email: string;
    role: Role;
    isEmailVerified: boolean;
  };
  calendar?: {
    id: string;
    name: string;
  };
  leaveGrade?: {
    id: string;
    name: string;
  };
}

/**
 * Employee update data
 */
export interface EmployeeUpdateData {
  firstName?: string;
  lastName?: string;
  code?: string;
  status?: string;
  joiningDate?: Date;
  calendarId?: string;
  leaveGradeId?: string;
}

/**
 * Employee creation data
 */
export interface EmployeeCreateData {
  firstName: string;
  lastName: string;
  code?: string;
  status: string;
  joiningDate: Date;
  calendarId?: string;
  leaveGradeId?: string;
  email?: string;
  role?: Role;
}