import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { OrganizationService } from '../services/organizationService';
import { ROLES } from '../constants';

const organizationService = new OrganizationService();

export class OrganizationController {
    async getOrganization(req: AuthRequest, res: Response): Promise<void> {
        try {
            if (!req.user?.organizationId) {
                res.status(400).json({ message: 'Organization context required' });
                return;
            }

            const organization = await organizationService.getOrganizationById(req.user.organizationId);

            if (!organization) {
                res.status(404).json({ message: 'Organization not found' });
                return;
            }

            res.status(200).json(organization);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    async updateOrganization(req: AuthRequest, res: Response): Promise<void> {
        try {
            // Only Admin (HR) can update organization details
            if (req.user?.role !== ROLES.HR && req.user?.role !== ROLES.ADMIN) {
                res.status(403).json({ message: 'Insufficient permissions' });
                return;
            }

            if (!req.user?.organizationId) {
                res.status(400).json({ message: 'Organization context required' });
                return;
            }

            const { name } = req.body;
            const organization = await organizationService.updateOrganization(req.user.organizationId, { name });

            res.status(200).json({
                message: 'Organization updated successfully',
                organization
            });
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }
}

export const organizationController = new OrganizationController();
