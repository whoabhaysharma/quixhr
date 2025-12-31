import { Role } from '@prisma/client';

// =========================================================================
// INTERNAL TYPES (NOT for API responses)
// =========================================================================

/**
 * Authenticated user context extracted from JWT token
 */
export interface AuthContext {
  userId: string;
  email: string;
  role: Role;
  employeeId?: string;
  companyId?: string;
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