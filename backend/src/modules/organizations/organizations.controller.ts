import { Request, Response, NextFunction } from 'express';
import { organizationService } from './organization.service';

class OrganizationController {
    async getAllOrganizations(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizations = await organizationService.getAllOrganizations();
            res.json({ success: true, data: { organizations } });
        } catch (error) {
            next(error);
        }
    }

    async getOrganizationById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(req.params.id);
            const organization = await organizationService.getOrganizationById(id);

            if (!organization) {
                res.status(404).json({ success: false, error: { message: 'Organization not found' } });
                return;
            }

            res.json({ success: true, data: { organization } });
        } catch (error) {
            next(error);
        }
    }

    async createOrganization(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { name } = req.body;
            const organization = await organizationService.createOrganization({ name });
            res.status(201).json({ success: true, data: { organization } });
        } catch (error) {
            next(error);
        }
    }

    async updateOrganization(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(req.params.id);
            const { name } = req.body;
            const organization = await organizationService.updateOrganization(id, { name });
            res.json({ success: true, data: { organization } });
        } catch (error) {
            next(error);
        }
    }

    async deleteOrganization(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(req.params.id);
            await organizationService.deleteOrganization(id);
            res.json({ success: true, message: 'Organization deleted successfully' });
        } catch (error) {
            next(error);
        }
    }
}

export const organizationController = new OrganizationController();
