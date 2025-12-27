import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

router.get('/ready', (_req: Request, res: Response) => {
    // Add any readiness checks here (database, redis, etc.)
    res.json({
        status: 'ready',
        timestamp: new Date().toISOString()
    });
});

export default router;
