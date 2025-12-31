import { Role } from '@prisma/client';
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
 * Invitation filters
 */
export interface InvitationFilters extends PaginationParams {
  email?: string;
  role?: Role;
  status?: string;
}

/**
 * Invitation creation data
 */
export interface InvitationCreateData {
  email: string;
  role: Role;
  expiresInHours?: number; // Default 72 hours
}

/**
 * Invitation data from database
 */
export interface InvitationData {
  id: string;
  companyId: string;
  email: string;
  role: Role;
  token: string;
  expiresAt: Date;
  status: string;
  createdAt: Date;
}

/**
 * Invitation acceptance data
 */
export interface InvitationAcceptanceData {
  token: string;
  firstName: string;
  lastName: string;
  password: string;
  employeeCode?: string;
  joiningDate?: Date;
  calendarId?: string;
  leaveGradeId?: string;
}