import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../../shared/middleware/auth.middleware';
import * as calendarService from './calendar.service';
import { CreateCalendarDto, UpdateCalendarDto, createCalendarSchema, updateCalendarSchema, weeklyRuleSchema } from './calendar.types';
import * as rulesService from './rules/rules.service';
import { Role, WeeklyRuleType } from '@prisma/client';



/**
 * Create a new calendar
 */
export async function create(req: AuthRequest, res: Response): Promise<void> {
    try {
        const dto = createCalendarSchema.parse(req.body);

        // Security: SUPER_ADMIN or HR_ADMIN of the same company
        if (req.user?.role !== Role.SUPER_ADMIN) {
            if (req.user?.role !== Role.HR_ADMIN || req.user?.companyId !== dto.companyId) {
                res.status(403).json({ success: false, error: 'Insufficient permissions' });
                return;
            }
        }

        const calendar = await calendarService.createCalendar(dto as CreateCalendarDto);
        res.status(201).json({ success: true, data: calendar });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message || 'Failed to create calendar' });
    }
}

/**
 * Get all calendars for a company
 */
export async function getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
        let companyId = req.query.companyId as string;

        // Security
        if (req.user?.role !== Role.SUPER_ADMIN) {
            if (!req.user?.companyId) {
                res.status(400).json({ success: false, error: 'User does not belong to a company' });
                return;
            }
            // Force restrict to own company
            companyId = req.user.companyId;
        } else if (!companyId) {
            res.status(400).json({ success: false, error: 'Company ID is required for Super Admin' });
            return;
        }

        const calendars = await calendarService.getAllCalendars(companyId);
        res.json({ success: true, data: calendars });
    } catch (error: any) {
        res.status(500).json({ success: false, error: 'Failed to fetch calendars' });
    }
}

/**
 * Get calendar by ID
 */
export async function getOne(req: AuthRequest, res: Response): Promise<void> {
    try {
        const calendar = await calendarService.getCalendarById(req.params.id);

        if (!calendar) {
            res.status(404).json({ success: false, error: 'Calendar not found' });
            return;
        }

        // Security
        if (req.user?.role !== Role.SUPER_ADMIN) {
            if (calendar.companyId !== req.user?.companyId) {
                res.status(403).json({ success: false, error: 'Access denied' });
                return;
            }
        }

        res.json({ success: true, data: calendar });
    } catch (error: any) {
        res.status(500).json({ success: false, error: 'Failed to fetch calendar' });
    }
}

/**
 * Update calendar
 */
export async function update(req: AuthRequest, res: Response): Promise<void> {
    try {
        const dto = updateCalendarSchema.parse(req.body);
        const { id } = req.params;

        const existing = await calendarService.getCalendarById(id);
        if (!existing) {
            res.status(404).json({ success: false, error: 'Calendar not found' });
            return;
        }

        // Security
        if (req.user?.role !== Role.SUPER_ADMIN) {
            if (req.user?.role !== Role.HR_ADMIN || req.user?.companyId !== existing.companyId) {
                res.status(403).json({ success: false, error: 'Insufficient permissions' });
                return;
            }
        }

        const calendar = await calendarService.updateCalendar(id, dto as UpdateCalendarDto);
        res.json({ success: true, data: calendar });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message || 'Failed to update calendar' });
    }
}

/**
 * Delete calendar
 */
export async function deleteOne(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const existing = await calendarService.getCalendarById(id);

        if (!existing) {
            res.status(404).json({ success: false, error: 'Calendar not found' });
            return;
        }

        // Security
        if (req.user?.role !== Role.SUPER_ADMIN) {
            if (req.user?.role !== Role.HR_ADMIN || req.user?.companyId !== existing.companyId) {
                res.status(403).json({ success: false, error: 'Insufficient permissions' });
                return;
            }
        }

        await calendarService.deleteCalendar(id);
        res.json({ success: true, message: 'Calendar deleted successfully' });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message || 'Failed to delete calendar' });
    }
}

/**
 * Update weekly rule
 */
export async function updateWeeklyRule(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const dto = weeklyRuleSchema.parse(req.body);

        const existing = await calendarService.getCalendarById(id);
        if (!existing) {
            res.status(404).json({ success: false, error: 'Calendar not found' });
            return;
        }

        // Security
        if (req.user?.role !== Role.SUPER_ADMIN) {
            if (req.user?.role !== Role.HR_ADMIN || req.user?.companyId !== existing.companyId) {
                res.status(403).json({ success: false, error: 'Insufficient permissions' });
                return;
            }
        }

        await rulesService.updateWeeklyRule(id, dto.dayOfWeek, dto.rule);
        res.json({ success: true, message: 'Weekly rule updated successfully' });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message || 'Failed to update weekly rule' });
    }
}
