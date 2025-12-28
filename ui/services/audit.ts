import api from '../lib/api';

export interface AuditLog {
    id: string;
    userId: string;
    action: string;
    resource: string;
    resourceId: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
    createdAt: string;
    user?: {
        id: string;
        email: string;
        role: string;
        employee?: {
            name: string;
        } | null;
    };
}

export interface GetAuditLogsParams {
    page?: number;
    limit?: number;
    action?: string;
    resource?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
}

export interface AuditLogsResponse {
    logs: AuditLog[];
    total: number;
}

export const auditService = {
    getLogs: async (params: GetAuditLogsParams) => {
        const { page = 1, limit = 20, ...rest } = params;
        const offset = (page - 1) * limit;

        const response = await api.get<AuditLogsResponse>('/audit', {
            params: { ...rest, limit, offset }
        });
        return response.data;
    },
};
