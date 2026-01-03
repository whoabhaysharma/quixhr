// =========================================================================
// INTERNAL TYPES (NOT for API responses)
// =========================================================================

/**
 * Authenticated user context extracted from JWT token
 */
export interface AuthContext {
  userId: string;
  email: string;
  role: string;
  employeeId?: string;
  organizationId?: string;
}

/**
 * Employee context for scoped operations
 */
export interface EmployeeContext {
  id: string;
  organizationId: string;
  userId: string;
  firstName: string;
  lastName: string;
  leaveGradeId?: string;
  calendarId?: string;
}

/**
 * Pagination query parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Query filters for audit logs
 */
export interface AuditLogFilters extends PaginationParams {
  action?: string;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
}
