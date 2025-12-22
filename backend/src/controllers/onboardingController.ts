import { Request, Response, NextFunction } from 'express';
import prisma from '../services/prisma';
import jwt from 'jsonwebtoken';

export const onboardingController = {
    async createOrganization(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { name } = req.body;
            const userId = (req as any).user.id; // User from JWT

            if (!name) {
                res.status(400).json({ error: { message: 'Organization name is required' } });
                return;
            }

            const user = await prisma.user.findUnique({ where: { id: userId } });

            if (!user) {
                res.status(404).json({ error: { message: 'User not found' } });
                return;
            }

            if (user.organizationId) {
                res.status(400).json({ error: { message: 'User already has an organization' } });
                return;
            }

            const result = await prisma.$transaction(async (tx) => {
                const org = await tx.organization.create({
                    data: {
                        name,
                    }
                });

                const updatedUser = await tx.user.update({
                    where: { id: userId },
                    data: { organizationId: org.id }
                });

                return { org, updatedUser };
            });

            // Re-issue Token with Organization ID
            const token = jwt.sign(
                {
                    id: result.updatedUser.id,
                    role: result.updatedUser.role,
                    organizationId: result.updatedUser.organizationId,
                },
                process.env.JWT_SECRET || 'default_secret',
                { expiresIn: '1d' }
            );

            res.status(201).json({
                data: {
                    user: result.updatedUser,
                    organization: result.org,
                    token
                }
            });

        } catch (error) {
            next(error);
        }
    }
}
