import { z } from 'zod';
import { Role } from '@prisma/client';

export const sendInvitationSchema = z.object({
    params: z.object({
        companyId: z.string().uuid('Invalid company ID'),
    }),
    body: z.object({
        email: z.string().email('Invalid email address'),
        role: z.nativeEnum(Role, { message: 'Invalid role' }),
    }),
});

export const listInvitationsSchema = z.object({
    params: z.object({
        companyId: z.string().uuid('Invalid company ID'),
    }),
    query: z.object({
        status: z.string().optional(),
    }).optional(),
});

export const revokeInvitationSchema = z.object({
    params: z.object({
        companyId: z.string().uuid('Invalid company ID'),
        id: z.string().uuid('Invalid invitation ID'),
    }),
});

export const validateTokenSchema = z.object({
    params: z.object({
        token: z.string().min(1, 'Token is required'),
    }),
});

export const acceptInvitationSchema = z.object({
    body: z.object({
        token: z.string().min(1, 'Token is required'),
        firstName: z.string().min(1, 'First name is required').max(50),
        lastName: z.string().min(1, 'Last name is required').max(50),
        password: z.string().min(8, 'Password must be at least 8 characters'),
    }),
});
