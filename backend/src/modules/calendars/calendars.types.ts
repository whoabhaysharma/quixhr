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
 * Calendar filters
 */
export interface CalendarFilters extends PaginationParams {
  name?: string;
  employeeId?: string;
}