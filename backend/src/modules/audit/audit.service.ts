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
