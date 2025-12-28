import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../../shared/middleware/auth.middleware';
import * as memberService from './member.service';
import { logAction } from '../audit/audit.service';
import { Role } from '@prisma/client';

const createMemberSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email'),
    role: z.nativeEnum(Role).optional(),
    status: z.string().optional(),
    companyId: z.string().uuid('Invalid company ID'),
});

const updateMemberSchema = z.object({
    name: z.string().optional(),
    status: z.string().optional(),
    role: z.nativeEnum(Role).optional(),
});

/**
 * Create a new member
 */
export async function create(req: AuthRequest, res: Response): Promise<void> {
    try {
        const dto = createMemberSchema.parse(req.body);

        // Security check: Only HR_ADMIN can create members
        // And they can only create for their own company unless SUPER_ADMIN
        if (req.user?.role !== Role.SUPER_ADMIN && req.user?.role !== Role.HR_ADMIN) {
            res.status(403).json({ success: false, error: 'Insufficient permissions' });
            return;
        }

        if (req.user?.role === Role.HR_ADMIN && req.user.companyId !== dto.companyId) {
            res.status(403).json({ success: false, error: 'Cannot create member for another company' });
            return;
        }

        const member = await memberService.createMember(dto);

        // Audit Log
        if (req.user?.id) {
            await logAction({
                userId: req.user.id,
                action: 'MEMBER_CREATE',
                resource: 'Member',
                resourceId: member.id,
                ipAddress: req.ip || req.socket.remoteAddress || 'Unknown',
                userAgent: req.headers['user-agent'],
                details: { name: member.name, email: dto.email, companyId: dto.companyId }
            });
        }

        res.status(201).json({ success: true, data: member });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message || 'Failed to create member' });
    }
}

/**
 * Get all members
 */
export async function getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string;

        let companyId = req.query.companyId as string;

        // Security: Restrict to own company for non-SUPER_ADMIN
        if (req.user?.role !== Role.SUPER_ADMIN) {
            if (!req.user?.companyId) {
                res.status(400).json({ success: false, error: 'User does not belong to a company' });
                return;
            }
            companyId = req.user.companyId;
        } else if (!companyId) {
            res.status(400).json({ success: false, error: 'Company ID is required for Super Admin' });
            return;
        }

        const result = await memberService.getAllMembers(companyId, page, limit, search);
        res.json({ success: true, data: result.data, pagination: { page, limit, total: result.total } });
    } catch (error: any) {
        res.status(500).json({ success: false, error: 'Failed to fetch members' });
    }
}

/**
 * Get member by ID
 */
export async function getOne(req: AuthRequest, res: Response): Promise<void> {
    try {
        const member = await memberService.getMemberById(req.params.id);

        if (!member) {
            res.status(404).json({ success: false, error: 'Member not found' });
            return;
        }

        // Security check
        if (req.user?.role !== Role.SUPER_ADMIN) {
            // Must be in same company
            if (member.companyId !== req.user?.companyId) {
                res.status(403).json({ success: false, error: 'Access denied' });
                return;
            }

            // If strictly an EMPLOYEE (not HR/Manager), can only view own profile
            if (req.user.role === Role.EMPLOYEE && req.user.employeeId !== member.id) {
                res.status(403).json({ success: false, error: 'Access denied' });
                return;
            }
        }

        res.json({ success: true, data: member });
    } catch (error: any) {
        res.status(500).json({ success: false, error: 'Failed to fetch member' });
    }
}

/**
 * Update member
 */
export async function update(req: AuthRequest, res: Response): Promise<void> {
    try {
        const dto = updateMemberSchema.parse(req.body);
        const { id } = req.params;

        const existingMember = await memberService.getMemberById(id);
        if (!existingMember) {
            res.status(404).json({ success: false, error: 'Member not found' });
            return;
        }

        // Security check
        if (req.user?.role !== Role.SUPER_ADMIN) {
            // Only HR_ADMIN of the same company
            if (req.user?.role !== Role.HR_ADMIN || req.user.companyId !== existingMember.companyId) {
                res.status(403).json({ success: false, error: 'Insufficient permissions' });
                return;
            }
        }

        const member = await memberService.updateMember(id, dto);

        // Audit Log
        if (req.user?.id) {
            await logAction({
                userId: req.user.id,
                action: 'MEMBER_UPDATE',
                resource: 'Member',
                resourceId: id,
                ipAddress: req.ip || req.socket.remoteAddress || 'Unknown',
                userAgent: req.headers['user-agent'],
                details: { updates: dto }
            });
        }

        res.json({ success: true, data: member });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message || 'Failed to update member' });
    }
}

/**
 * Delete member
 */
export async function deleteOne(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const existingMember = await memberService.getMemberById(id);

        if (!existingMember) {
            res.status(404).json({ success: false, error: 'Member not found' });
            return;
        }

        // Security check
        if (req.user?.role !== Role.SUPER_ADMIN) {
            // Only HR_ADMIN of the same company
            if (req.user?.role !== Role.HR_ADMIN || req.user.companyId !== existingMember.companyId) {
                res.status(403).json({ success: false, error: 'Insufficient permissions' });
                return;
            }
        }

        await memberService.deleteMember(id);

        // Audit Log
        if (req.user?.id) {
            await logAction({
                userId: req.user.id,
                action: 'MEMBER_DELETE',
                resource: 'Member',
                resourceId: id,
                ipAddress: req.ip || req.socket.remoteAddress || 'Unknown',
                userAgent: req.headers['user-agent'],
                details: { deletedMemberId: id }
            });
        }

        res.json({ success: true, message: 'Member deleted successfully' });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message || 'Failed to delete member' });
    }
}

/**
 * Assign calendar to member
 */
export async function assignCalendar(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const { calendarId } = req.body;

        if (!calendarId) {
            res.status(400).json({ success: false, error: 'Calendar ID is required' });
            return;
        }

        const member = await memberService.getMemberById(id);
        if (!member) {
            res.status(404).json({ success: false, error: 'Member not found' });
            return;
        }

        // Security
        if (req.user?.role !== Role.SUPER_ADMIN) {
            if (req.user?.role !== Role.HR_ADMIN || req.user?.companyId !== member.companyId) {
                res.status(403).json({ success: false, error: 'Insufficient permissions' });
                return;
            }
        }

        await memberService.assignCalendarToMember(id, calendarId);
        res.json({ success: true, message: 'Calendar assigned to member successfully' });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message || 'Failed to assign calendar' });
    }
}
