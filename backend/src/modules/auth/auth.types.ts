import { Role } from '@prisma/client';

// =========================================================================
// JWT TOKEN PAYLOAD
// =========================================================================
/**
 * Internal type for JWT token payload
 * Contains user identification and authorization data
 */
export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
  employeeId?: string;
  companyId?: string;
  iat?: number;
  exp?: number;
}
