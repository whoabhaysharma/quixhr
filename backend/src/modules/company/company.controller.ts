import { Request, Response } from 'express';
import { z } from 'zod';
import * as companyService from './company.service';
import { AuthRequest } from '../../shared/middleware/auth.middleware';
import { Role } from '@prisma/client';
// Actually AuthRequest isn't exported from controller usuall. Let's define it or import from auth.types if available.
// checking auth.types.ts...

const createCompanySchema = z.object({
    name: z.string().min(1, 'Company name is required'),
    timezone: z.string().optional(),
});

const updateCompanySchema = z.object({
    name: z.string().min(1, 'Company name must not be empty').optional(),
    timezone: z.string().optional(),
});

/**
 * Create a new company
 */
export async function create(req: AuthRequest, res: Response): Promise<void> {
    try {
        const dto = createCompanySchema.parse(req.body);

        if (!req.user || !req.user.id) {
            res.status(401).json({ success: false, error: 'User not authenticated' });
            return;
        }

        const company = await companyService.createCompany({
            ...dto,
        });
        res.status(201).json({ success: true, data: company });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message || 'Failed to create company' });
    }
}

/**
 * Get all companies
 */
export async function getAll(req: Request, res: Response): Promise<void> {
    try {
        const companies = await companyService.getAllCompanies();
        res.json({ success: true, data: companies });
    } catch (error: any) {
        res.status(500).json({ success: false, error: 'Failed to fetch companies' });
    }
}

/**
 * Get company by ID
 */
export async function getOne(req: Request, res: Response): Promise<void> {
    try {
        const company = await companyService.getCompanyById(req.params.id);
        if (!company) {
            res.status(404).json({ success: false, error: 'Company not found' });
            return;
        }
        res.json({ success: true, data: company });
    } catch (error: any) {
        res.status(500).json({ success: false, error: 'Failed to fetch company' });
    }
}

/**
 * Update company
 */
export async function update(req: AuthRequest, res: Response): Promise<void> {
    try {
        const dto = updateCompanySchema.parse(req.body);
        const { id } = req.params;

        // Check ownership
        const existingCompany = await companyService.getCompanyById(id);
        if (!existingCompany) {
            res.status(404).json({ success: false, error: 'Company not found' });
            return;
        }

        // Check permissions
        // Check permissions
        if (req.user?.role !== Role.SUPER_ADMIN) {
            // Check if user is HR_ADMIN of this company
            if (req.user?.role !== Role.HR_ADMIN || req.user?.companyId !== id) {
                res.status(403).json({ success: false, error: 'You do not have permission to manage this company' });
                return;
            }
        }

        const company = await companyService.updateCompany(req.params.id, dto);
        res.json({ success: true, data: company });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message || 'Failed to update company' });
    }
}

/**
 * Delete company
 */
export async function deleteOne(req: AuthRequest, res: Response): Promise<void> {
    try {
        await companyService.deleteCompany(req.params.id);
        res.json({ success: true, message: 'Company deleted successfully' });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message || 'Failed to delete company' });
    }
}
