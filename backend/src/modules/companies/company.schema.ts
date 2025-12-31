import { z } from 'zod';

// ============================================================================
// COMPANY VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema for updating company settings
 * Validates timezone, currency, logo uploads, and other company configuration
 */
export const updateCompanySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    timezone: z.string().optional(),
    currency: z.string().length(3).optional(), // ISO currency code (USD, EUR, etc.)
    logo: z.string().url().optional(), // Logo URL after upload
    description: z.string().max(500).optional(),
    website: z.string().url().optional(),
    phone: z.string().max(20).optional(),
    address: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      zipCode: z.string().optional(),
    }).optional(),
    settings: z.object({
      workWeek: z.array(z.number().min(0).max(6)).optional(), // 0=Sunday, 6=Saturday
      workingHours: z.object({
        start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:MM format
        end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      }).optional(),
      defaultLeaveGradeId: z.string().uuid().optional(),
    }).optional(),
  }),
  params: z.object({
    companyId: z.string().uuid(),
  }),
});

/**
 * Schema for billing upgrade requests
 */
export const upgradeCompanySchema = z.object({
  body: z.object({
    planId: z.string().uuid(),
    paymentMethod: z.enum(['RAZORPAY', 'STRIPE']).default('RAZORPAY'),
    billingCycle: z.enum(['MONTHLY', 'YEARLY']).default('MONTHLY'),
  }),
  params: z.object({
    companyId: z.string().uuid(),
  }),
});

/**
 * Schema for audit logs query
 */
export const auditLogsQuerySchema = z.object({
  query: z.object({
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('20'),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    action: z.string().optional(),
    userId: z.string().uuid().optional(),
  }),
  params: z.object({
    companyId: z.string().uuid(),
  }),
});

/**
 * Schema for dashboard stats query
 */
export const dashboardQuerySchema = z.object({
  query: z.object({
    date: z.string().datetime().optional(),
    range: z.enum(['TODAY', 'WEEK', 'MONTH', 'QUARTER', 'YEAR']).default('TODAY'),
  }),
  params: z.object({
    companyId: z.string().uuid(),
  }),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type UpdateCompanyDto = z.infer<typeof updateCompanySchema>['body'];
export type UpgradeCompanyDto = z.infer<typeof upgradeCompanySchema>['body'];
export type AuditLogsQueryDto = z.infer<typeof auditLogsQuerySchema>['query'];
export type DashboardQueryDto = z.infer<typeof dashboardQuerySchema>['query'];