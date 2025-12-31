import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';
import { LeaveGradeService } from './leave-grades.service';
import { AuthContext } from './leave-grades.types';
import { AppError } from '@/utils/appError';
import {
  LeaveGradeResponseDto,
  LeaveGradeDetailsResponseDto,
  LeaveGradesListResponseDto,
} from './leave-grades.schema';

// =========================================================================
// HELPER FUNCTIONS
// =========================================================================

/**
 * Get auth context from request
 */
const getAuthContext = (req: Request): AuthContext => {
  const user = (req as any).user;
  if (!user) {
    throw new AppError('User not authenticated', 401);
  }
  return user as AuthContext;
};

// =========================================================================
// LEAVE GRADE ENDPOINTS
// =========================================================================

/**
 * @desc    Get all leave grades for a company
 * @route   GET /api/v1/companies/:companyId/leave-grades
 * @access  Protected (ORG_ADMIN, HR_ADMIN, MANAGER, SUPER_ADMIN)
 */
export const getLeaveGrades = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authContext = getAuthContext(req);
    const { companyId } = req.params;
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const name = req.query.name as string;

    const result = await LeaveGradeService.getLeaveGrades({
      authContext,
      companyId,
      page,
      limit,
      name,
    });

    const responseData: LeaveGradesListResponseDto = {
      success: true,
      message: 'Leave grades retrieved successfully',
      data: {
        leaveGrades: result.leaveGrades,
        pagination: result.pagination,
      },
    };

    sendResponse(res, 200, responseData);
  }
);

/**
 * @desc    Get leave grade details by ID
 * @route   GET /api/v1/companies/:companyId/leave-grades/:leaveGradeId
 * @access  Protected (ORG_ADMIN, HR_ADMIN, MANAGER, SUPER_ADMIN)
 */
export const getLeaveGradeById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authContext = getAuthContext(req);
    const { companyId, leaveGradeId } = req.params;

    const leaveGrade = await LeaveGradeService.getLeaveGradeById({
      authContext,
      companyId,
      leaveGradeId,
    });

    const responseData: LeaveGradeDetailsResponseDto = {
      success: true,
      message: 'Leave grade details retrieved successfully',
      data: leaveGrade,
    };

    sendResponse(res, 200, responseData);
  }
);

/**
 * @desc    Create a new leave grade
 * @route   POST /api/v1/companies/:companyId/leave-grades
 * @access  Protected (ORG_ADMIN, HR_ADMIN, SUPER_ADMIN)
 */
export const createLeaveGrade = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authContext = getAuthContext(req);
    const { companyId } = req.params;
    
    const leaveGrade = await LeaveGradeService.createLeaveGrade({
      authContext,
      companyId,
      data: req.body,
    });

    const responseData: LeaveGradeResponseDto = {
      success: true,
      message: 'Leave grade created successfully',
      data: leaveGrade,
    };

    sendResponse(res, 201, responseData);
  }
);

/**
 * @desc    Update leave grade
 * @route   PATCH /api/v1/companies/:companyId/leave-grades/:leaveGradeId
 * @access  Protected (ORG_ADMIN, HR_ADMIN, SUPER_ADMIN)
 */
export const updateLeaveGrade = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authContext = getAuthContext(req);
    const { companyId, leaveGradeId } = req.params;

    const leaveGrade = await LeaveGradeService.updateLeaveGrade({
      authContext,
      companyId,
      leaveGradeId,
      data: req.body,
    });

    const responseData: LeaveGradeResponseDto = {
      success: true,
      message: 'Leave grade updated successfully',
      data: leaveGrade,
    };

    sendResponse(res, 200, responseData);
  }
);

/**
 * @desc    Delete leave grade
 * @route   DELETE /api/v1/companies/:companyId/leave-grades/:leaveGradeId
 * @access  Protected (SUPER_ADMIN only)
 */
export const deleteLeaveGrade = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authContext = getAuthContext(req);
    const { companyId, leaveGradeId } = req.params;

    await LeaveGradeService.deleteLeaveGrade({
      authContext,
      companyId,
      leaveGradeId,
    });

    const responseData = {
      success: true,
      message: 'Leave grade deleted successfully',
      data: null,
    };

    sendResponse(res, 200, responseData);
  }
);