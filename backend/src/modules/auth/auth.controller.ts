import { Request, Response } from 'express';
import * as AuthService from './auth.service';
import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';

/**
 * @desc    Register a new Company and Admin User
 * @route   POST /api/v1/auth/register
 */
export const register = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.registerCompany(req.body);

    sendResponse(res, 201, result, 'Company and Admin account created successfully');
});

/**
 * @desc    Authenticate User & Get Token
 * @route   POST /api/v1/auth/login
 */
export const login = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.login(req.body);

    sendResponse(res, 200, result, 'Logged in successfully');
});

/**
 * @desc    Accept Invitation (Employee Onboarding)
 * @route   POST /api/v1/auth/accept-invitation
 */
export const acceptInvitation = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.acceptInvitation(req.body);

    sendResponse(res, 200, result, 'Account created successfully');
});

/**
 * @desc    Initiate Password Reset (Forgot Password)
 * @route   POST /api/v1/auth/forgot-password
 */
export const forgotPassword = catchAsync(async (req: Request, res: Response) => {
    await AuthService.forgotPassword(req.body.email);

    sendResponse(res, 200, null, 'If an account exists with that email, a reset link has been sent.');
});

/**
 * @desc    Reset Password using Token
 * @route   POST /api/v1/auth/reset-password
 */
export const resetPassword = catchAsync(async (req: Request, res: Response) => {
    const { token, password } = req.body;
    await AuthService.resetPassword(token, password);

    sendResponse(res, 200, null, 'Password has been reset successfully. Please login with your new password.');
});

/**
 * @desc    Update Password (while logged in)
 * @route   PATCH /api/v1/auth/update-password
 */
export const updatePassword = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { currentPassword, newPassword } = req.body;

    await AuthService.updatePassword(userId as string, currentPassword, newPassword);

    sendResponse(res, 200, null, 'Password updated successfully');
});

/**
 * @desc    Get Current Logged-in User Info
 * @route   GET /api/v1/auth/me
 */
export const getMe = catchAsync(async (req: Request, res: Response) => {
    const user = await AuthService.getUserById(req.user?.userId as string);

    sendResponse(res, 200, { user });
});