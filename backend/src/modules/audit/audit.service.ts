import { addAuditLogJob } from '../../infra/queues/audit.queue';

export interface LogActionParams {
    userId: string;
    action: string;
    resource: string;
    resourceId: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Log an action to the audit log asynchronously
 */
export async function logAction(params: LogActionParams): Promise<void> {
    try {
        await addAuditLogJob(params);
    } catch (error) {
        console.error('Failed to dispatch audit log job:', error);
        // Fail silently to not impact main flow, or throw?
        // Usually audit logging failure shouldn't crash the main request unless critical compliance.
    }
}
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
