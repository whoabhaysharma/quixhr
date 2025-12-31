import { z } from 'zod';
import { Role } from '@prisma/client';

// =========================================================================
// VALIDATION SCHEMAS & REQUEST DTOs (Inferred from Schemas)
// =========================================================================

/**
 * Register schema - Create new company + super admin
 */
export const registerSchema = z.object({
  companyName: z
    .string()
    .min(2, 'Company name must be at least 2 characters')
    .max(255, 'Company name must not exceed 255 characters'),
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
  confirmPassword: z.string(),
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must not exceed 100 characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must not exceed 100 characters'),
  joiningDate: z.coerce.date().default(() => new Date()),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type RegisterRequestDto = z.infer<typeof registerSchema>;

export type RegisterRequestDto = z.infer<typeof registerSchema>;

/**
 * Login schema
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginRequestDto = z.infer<typeof loginSchema>;

/**
 * Forgot password schema
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export type ForgotPasswordRequestDto = z.infer<typeof forgotPasswordSchema>;

/**
 * Reset password schema
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one digit')
    .regex(/[@$!%*?&#^-]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type ResetPasswordRequestDto = z.infer<typeof resetPasswordSchema>;

/**
 * Verify email schema
 */
export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

export type VerifyEmailRequestDto = z.infer<typeof verifyEmailSchema>;

/**
 * Join company schema - Accept invitation
 */
export const joinCompanySchema = z.object({
  token: z.string().min(1, 'Invitation token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one digit')
    .regex(/[@$!%*?&#^-]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must not exceed 100 characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must not exceed 100 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type JoinCompanyRequestDto = z.infer<typeof joinCompanySchema>;

/**
 * Change password schema
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one digit')
    .regex(/[@$!%*?&#^-]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type ChangePasswordRequestDto = z.infer<typeof changePasswordSchema>;

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
    companyId: string;
  };
  createdAt?: Date;
}
