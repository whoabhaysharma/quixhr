import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '@/utils/catchAsync';
import { sendResponse } from '@/utils/sendResponse';
import { getOrganizationContext } from '@/utils/tenantContext';
import { getPaginationParams } from '@/utils/pagination';
import { MemberService } from './members.service';
import { CreateMemberInput, UpdateMemberInput } from './members.schema';
import { Role } from '@prisma/client';
import { AppError } from '@/utils/appError';

export const getMembers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const organizationId = getOrganizationContext(req, next);
  const pagination = getPaginationParams(req, 'firstName', 'asc');

  const user = req.user!;
  const filters = {
    status: req.query.status as any,
    role: req.query.role as any,
    calendarId: req.query.calendarId as string,
    leaveGradeId: req.query.leaveGradeId as string,
  };

  const result = await MemberService.getMembers(
    organizationId,
    user.role as Role,
    user.id,
    pagination,
    filters
  );

  sendResponse(res, 200, result, 'Members retrieved successfully');
});

export const getMember = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const organizationId = getOrganizationContext(req, next);
  const user = req.user!;

  const member = await MemberService.getMember(
      organizationId,
      req.params.id,
      user.role as Role,
      user.id
  );

  sendResponse(res, 200, member, 'Member details retrieved');
});

export const createMember = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const organizationId = getOrganizationContext(req, next);
  const user = req.user!;

  const member = await MemberService.createMember(
      organizationId,
      req.body as CreateMemberInput,
      user.role as Role
  );

  sendResponse(res, 201, member, 'Member created successfully');
});

export const updateMember = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const organizationId = getOrganizationContext(req, next);
  const user = req.user!;

  const member = await MemberService.updateMember(
      organizationId,
      req.params.id,
      req.body as UpdateMemberInput,
      user.role as Role
  );

  sendResponse(res, 200, member, 'Member updated successfully');
});

export const deleteMember = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const organizationId = getOrganizationContext(req, next);
  const user = req.user!;

  await MemberService.deleteMember(
      organizationId,
      req.params.id,
      user.role as Role
  );

  sendResponse(res, 200, null, 'Member deleted successfully');
});
