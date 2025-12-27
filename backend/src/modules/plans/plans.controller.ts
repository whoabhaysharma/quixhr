import { Request, Response, NextFunction } from 'express';
import { planService } from './plan.service';

class PlanController {
    async getAllPlans(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const plans = await planService.getAllPlans();
            res.json({ success: true, data: { plans } });
        } catch (error) {
            next(error);
        }
    }

    async getPlanById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(req.params.id);
            const plan = await planService.getPlanById(id);

            if (!plan) {
                res.status(404).json({ success: false, error: { message: 'Plan not found' } });
                return;
            }

            res.json({ success: true, data: { plan } });
        } catch (error) {
            next(error);
        }
    }

    async createPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const plan = await planService.createPlan(req.body);
            res.status(201).json({ success: true, data: { plan } });
        } catch (error) {
            next(error);
        }
    }

    async updatePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(req.params.id);
            const plan = await planService.updatePlan(id, req.body);
            res.json({ success: true, data: { plan } });
        } catch (error) {
            next(error);
        }
    }

    async deletePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = Number(req.params.id);
            await planService.deletePlan(id);
            res.json({ success: true, message: 'Plan deleted successfully' });
        } catch (error) {
            next(error);
        }
    }
}

export const planController = new PlanController();
