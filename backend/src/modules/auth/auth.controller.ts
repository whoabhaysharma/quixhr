import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '@/utils/prisma';
import { sendEmail } from '@/infra/email/email.service';
import { AppError } from '@/utils/appError';
import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';
import { TokenPayload } from './auth.types';
import {
  AuthResponseDto,
  UserResponseDto,
  RegisterRequestDto,
  LoginRequestDto,
  ForgotPasswordRequestDto,
  ResetPasswordRequestDto,
  VerifyEmailRequestDto,
  ChangePasswordRequestDto,
} from './auth.schema';

// =========================================================================
// HELPER FUNCTIONS
// =========================================================================

/**
 * Generate JWT token
 */
const generateToken = (payload: TokenPayload, expiresIn: string = '7d'): string => {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  return jwt.sign(payload, secret, {
    expiresIn,
  } as any);
};

/**
 * Generate password reset token
 */
const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash password
 */
const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compare passwords
 */
const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Build user response DTO
 */
const buildUserResponse = (user: any): UserResponseDto => {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    employee: user.employee
      ? {
          id: user.employee.id,
          firstName: user.employee.firstName,
          lastName: user.employee.lastName,
          code: user.employee.code,
          status: user.employee.status,
          joiningDate: user.employee.joiningDate,
          companyId: user.employee.companyId,
        }
      : undefined,
  };
};

// =========================================================================
// AUTHENTICATION CONTROLLERS
// =========================================================================

/**
 * @desc    Register new company + super admin
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
export const register = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      companyName,
      timezone = 'Asia/Kolkata',
      currency = 'INR',
      dateFormat = 'DD/MM/YYYY',
      email,
      password,
      firstName,
      lastName,
      joiningDate = new Date(),
    }: RegisterRequestDto = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return next(new AppError('User with this email already exists', 400));
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user, company, employee, and subscription in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Company
      const company = await tx.company.create({
        data: {
          name: companyName,
          timezone,
          currency,
          dateFormat,
        },
      });

      // 2. Create User (Super Admin)
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'SUPER_ADMIN',
          isEmailVerified: false,
        },
      });

      // 3. Create Employee for Super Admin
      const employee = await tx.employee.create({
        data: {
          companyId: company.id,
          userId: user.id,
          firstName,
          lastName,
          status: 'ACTIVE',
          joiningDate: new Date(joiningDate),
        },
      });

      // 4. Create Subscription (Start with free plan or trial)
      const plan = await tx.plan.findFirst({ where: { isActive: true } });
      if (plan) {
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + 30); // 30 days trial

        await tx.subscription.create({
          data: {
            companyId: company.id,
            planId: plan.id,
            status: 'ACTIVE',
            validUntil,
          },
        });
      }

      return { user, company, employee };
    });

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role,
      employeeId: result.employee.id,
      companyId: result.company.id,
    };

    const accessToken = generateToken(tokenPayload, '1h');
    const refreshToken = generateToken(tokenPayload, '7d');

    // Send verification email
    await sendEmail({
      to: email,
      subject: 'Verify your email',
      template: 'verify-email',
      data: {
        name: firstName,
        verificationLink: `${process.env.FRONTEND_URL}/verify-email?token=${accessToken}`,
      },
    });

    const userWithEmployee = {
      ...result.user,
      employee: result.employee,
    };

    const response: AuthResponseDto = {
      accessToken,
      refreshToken,
      user: buildUserResponse(userWithEmployee),
    };

    sendResponse(res, 201, response, 'Company and user registered successfully');
  }
);

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password }: LoginRequestDto = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { employee: true },
    });

    if (!user) {
      return next(new AppError('Invalid email or password', 401));
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return next(new AppError('Invalid email or password', 401));
    }

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employee?.id,
      companyId: user.employee?.companyId,
    };

    const accessToken = generateToken(tokenPayload, '1h');
    const refreshToken = generateToken(tokenPayload, '7d');

    const response: AuthResponseDto = {
      accessToken,
      refreshToken,
      user: buildUserResponse({ ...user, employee: user.employee || undefined }),
    };

    sendResponse(res, 200, response, 'User logged in successfully');
  }
);

/**
 * @desc    Refresh access token
 * @route   POST /api/v1/auth/refresh-token
 * @access  Public
 */
export const refreshToken = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(new AppError('Refresh token is required', 400));
    }

    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_SECRET || 'your-secret-key'
      ) as TokenPayload;

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { employee: true },
      });

      if (!user) {
        return next(new AppError('User not found', 404));
      }

      const tokenPayload: TokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        employeeId: user.employee?.id,
        companyId: user.employee?.companyId,
      };

      const accessToken = generateToken(tokenPayload, '1h');
      const newRefreshToken = generateToken(tokenPayload, '7d');

      const response: AuthResponseDto = {
        accessToken,
        refreshToken: newRefreshToken,
        user: buildUserResponse({ ...user, employee: user.employee || undefined }),
      };

      sendResponse(res, 200, response, 'Token refreshed successfully');
    } catch (error) {
      return next(new AppError('Invalid refresh token', 401));
    }
  }
);

/**
 * @desc    Request password reset
 * @route   POST /api/v1/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email }: ForgotPasswordRequestDto = req.body;

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal if user exists or not (security best practice)
      return sendResponse(
        res,
        200,
        'If user exists, password reset email will be sent'
      );
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const resetTokenHash = await hashPassword(resetToken);
    const expiresIn = new Date();
    expiresIn.setHours(expiresIn.getHours() + 1); // Token expires in 1 hour

    // Update user with reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetTokenHash,
        passwordResetExpires: expiresIn,
        lastPasswordResetRequest: new Date(),
      },
    });

    // Send reset email
    try {
      await sendEmail({
        to: email,
        subject: 'Password Reset Request',
        template: 'reset-password',
        data: {
          name: user.email,
          resetLink: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`,
          expiresIn: '1 hour',
        },
      });
    } catch (error) {
      // Revert the changes if email fails
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: null,
          passwordResetExpires: null,
        },
      });
      return next(new AppError('Failed to send reset email', 500));
    }

    sendResponse(res, 200, 'If user exists, password reset email will be sent');
  }
);

/**
 * @desc    Reset password
 * @route   POST /api/v1/auth/reset-password
 * @access  Public
 */
export const resetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { token, password }: ResetPasswordRequestDto = req.body;

    // Find user with valid reset token
    const users = await prisma.user.findMany();
    let user = null;

    for (const u of users) {
      if (u.passwordResetToken && new Date() < (u.passwordResetExpires || new Date())) {
        const isTokenValid = await comparePassword(token, u.passwordResetToken);
        if (isTokenValid) {
          user = u;
          break;
        }
      }
    }

    if (!user) {
      return next(new AppError('Invalid or expired reset token', 400));
    }

    // Update password
    const hashedPassword = await hashPassword(password);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    sendResponse(res, 200, 'Password reset successfully');
  }
);

/**
 * @desc    Verify email
 * @route   POST /api/v1/auth/verify-email
 * @access  Public
 */
export const verifyEmail = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { token }: VerifyEmailRequestDto = req.body;

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key'
      ) as TokenPayload;

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        return next(new AppError('User not found', 404));
      }

      if (user.isEmailVerified) {
        return sendResponse(res, 200, 'Email already verified');
      }

      // Mark email as verified
      await prisma.user.update({
        where: { id: user.id },
        data: { isEmailVerified: true },
      });

      sendResponse(res, 200, 'Email verified successfully');
    } catch (error) {
      return next(new AppError('Invalid or expired verification token', 401));
    }
  }
);

/**
 * @desc    Logout user
 * @route   POST /api/v1/auth/logout
 * @access  Protected
 */
export const logout = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // Token invalidation could be implemented via:
    // 1. Redis blacklist
    // 2. Database token table
    // 3. Frontend-side token removal

    // For now, just return success (token will expire naturally)
    sendResponse(res, 200, null, 'User logged out successfully');
  }
);

/**
 * @desc    Change password
 * @route   POST /api/v1/auth/change-password
 * @access  Protected
 */
export const changePassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user?.userId;
    const { currentPassword, newPassword }: ChangePasswordRequestDto = req.body;

    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isPasswordValid) {
      return next(new AppError('Current password is incorrect', 401));
    }

    // Update password
    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    sendResponse(res, 200, null, 'Password changed successfully');
  }
);
