import { z } from 'zod';

// Login DTO
export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginDto = z.infer<typeof loginSchema>;

// Register DTO
export const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    companyName: z.string().min(2, 'Company name must be at least 2 characters'),
});

export type RegisterDto = z.infer<typeof registerSchema>;

// Forgot Password DTO
export const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
});

export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;

// Reset Password DTO
export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Token is required'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;

// Auth Response DTO
export interface AuthResponseDto {
    token: string;
    user: {
        id: string;
        email: string;
        role: string;
        employee?: {
            id: string;
            name: string;
            companyId: string;
        };
    };
}
