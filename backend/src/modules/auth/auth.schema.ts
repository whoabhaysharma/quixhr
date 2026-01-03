import { z } from 'zod';
import { Role } from '@prisma/client';

// =========================================================================
// VALIDATION SCHEMAS & REQUEST DTOs (Inferred from Schemas)
// =========================================================================

/**
 * Register schema - Create new organization + super admin
 */
/**
 * Register schema - Create new organization + super admin
 */
const registerBodySchema = z.object({
  organizationName: z
    .string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(255, 'Organization name must not exceed 255 characters'),
  timezone: z.string().default('Asia/Kolkata'),
  currency: z.string().default('INR'),
  dateFormat: z.string().default('DD/MM/YYYY'),
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one digit')
    .regex(/[@$!%*?&#^-]/, 'Password must contain at least one special character'),
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must not exceed 100 characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must not exceed 100 characters'),
  joiningDate: z.coerce.date().default(() => new Date()),
});

export const registerSchema = {
  body: registerBodySchema,
};

export type RegisterRequestDto = z.infer<typeof registerBodySchema>;

/**
 * Login schema
 */
export const loginSchema = {
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
};

export type LoginRequestDto = z.infer<typeof loginSchema.body>;

/**
 * Forgot password schema
 */
export const forgotPasswordSchema = {
  body: z.object({
    email: z.string().email('Invalid email format'),
  }),
};

export type ForgotPasswordRequestDto = z.infer<typeof forgotPasswordSchema.body>;

/**
 * Reset password schema
 */
const resetPasswordBodySchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one digit')
    .regex(/[@$!%*?&#^-]/, 'Password must contain at least one special character'),
});

export const resetPasswordSchema = {
  body: resetPasswordBodySchema,
};

export type ResetPasswordRequestDto = z.infer<typeof resetPasswordBodySchema>;

/**
 * Verify email schema
 */
export const verifyEmailSchema = {
  body: z.object({
    token: z.string().min(1, 'Verification token is required'),
  }),
};

export type VerifyEmailRequestDto = z.infer<typeof verifyEmailSchema.body>;

/**
 * Change password schema
 */
const changePasswordBodySchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one digit')
    .regex(/[@$!%*?&#^-]/, 'Password must contain at least one special character'),
});

export const changePasswordSchema = {
  body: changePasswordBodySchema,
};

export type ChangePasswordRequestDto = z.infer<typeof changePasswordBodySchema>;

// =========================================================================
// RESPONSE DTOs (Manual Interfaces - we trust our own backend)
// =========================================================================

/**
 * Auth response - Contains tokens and user information
 */
export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: UserResponseDto;
}

/**
 * User response DTO
 */
export interface UserResponseDto {
  id: string;
  email: string;
  role: Role;
  isEmailVerified: boolean;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    code?: string;
    status: string;
    joiningDate: Date;
    organizationId: string;
  };
  createdAt?: Date;
}
