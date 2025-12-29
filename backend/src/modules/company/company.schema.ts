import { z } from 'zod';
import { Role } from '@prisma/client';

export const getSettingsSchema = z.object({
    // No body/params needed - uses req.targetCompanyId
});

export const updateSettingsSchema = z.object({
    body: z.object({
        timezone: z.string().optional(),
        currency: z.string().length(3).optional(), // ISO 4217 currency codes (USD, EUR, INR)
        dateFormat: z.string().optional(),
        logoUrl: z.string().url().optional(),
    }).refine((data) => Object.keys(data).length > 0, {
        message: 'At least one field must be provided',
    }),
});

export const inviteUserSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address'),
        role: z.nativeEnum(Role, {
            message: 'Invalid role',
        }),
    }),
});

export const listInvitesSchema = z.object({
    query: z.object({
        status: z.enum(['PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED']).optional(),
    }).optional(),
});

export const revokeInviteSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid invitation ID'),
    }),
});

export const listUsersSchema = z.object({
    query: z.object({
        role: z.nativeEnum(Role).optional(),
    }).optional(),
});

export const updateUserRoleSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid user ID'),
    }),
    body: z.object({
        role: z.nativeEnum(Role, {
            message: 'Invalid role',
        }),
    }),
});
