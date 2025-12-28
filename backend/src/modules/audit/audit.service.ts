import { PrismaClient } from '@prisma/client';
import { addAuditLogJob } from '../../infra/queues/audit.queue';

const prisma = new PrismaClient();

export interface LogActionParams {
    userId: string;
    action: string;
    resource: string;
    resourceId: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
}

export interface GetAuditLogsOptions {
    limit?: number;
    offset?: number;
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
}

/**
 * Log an action to the audit log asynchronously
 */
export async function logAction(params: LogActionParams): Promise<void> {
    try {
        await addAuditLogJob(params);
    } catch (error) {
        console.error('Failed to dispatch audit log job:', error);
    }
}

/**
 * Get audit logs with filtering and pagination
 */
export async function getAuditLogs(options: GetAuditLogsOptions) {
    const { limit = 20, offset = 0, userId, action, resource, startDate, endDate } = options;

    const where: any = {};
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (resource) where.resource = resource;
    if (startDate && endDate) {
        where.createdAt = {
            gte: startDate,
            lte: endDate,
        };
    } else if (startDate) {
        where.createdAt = { gte: startDate };
    }

    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                        employee: {
                            select: {
                                name: true,
                            }
                        }
                    }
                }
            }
        }),
        prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
}

/**
 * Delete old audit logs
 */
export async function deleteOldAuditLogs(days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await prisma.auditLog.deleteMany({
        where: {
            createdAt: {
                lt: cutoffDate,
            },
        },
    });

    return result.count;
}
