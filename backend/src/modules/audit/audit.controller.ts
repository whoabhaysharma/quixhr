import { Request, Response } from 'express';
import { getAuditLogs } from './audit.service';
import { z } from 'zod';

export const getAuditLogsHandler = async (req: Request, res: Response) => {
    try {
        const schema = z.object({
            limit: z.coerce.number().default(20),
            offset: z.coerce.number().default(0),
            userId: z.string().optional(),
            action: z.string().optional(),
            resource: z.string().optional(),
            startDate: z.string().transform((str) => new Date(str)).optional(),
            endDate: z.string().transform((str) => new Date(str)).optional(),
        });

        const query = schema.parse(req.query);

        const result = await getAuditLogs(query);

        res.json({
            success: true,
            data: result.logs,
            pagination: {
                total: result.total,
                limit: query.limit,
                offset: query.offset
            }
        });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ message: 'Invalid query parameters', errors: error.issues });
        } else {
            res.status(500).json({ message: 'Failed to fetch audit logs' });
        }
    }
};
