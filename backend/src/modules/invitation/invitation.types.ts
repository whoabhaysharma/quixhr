import { Role } from '@prisma/client';
import { z } from 'zod';

export const createInvitationSchema = z.object({
    email: z.string().email('Invalid email address'),
    role: z.nativeEnum(Role),
});

export type CreateInvitationDto = z.infer<typeof createInvitationSchema>;

export const acceptInvitationSchema = z.object({
    token: z.string().min(1, 'Token is required'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type AcceptInvitationDto = z.infer<typeof acceptInvitationSchema>;

export interface InvitationResponseDto {
    id: string;
    email: string;
    role: Role;
    token: string;
    expiresAt: Date;
    status: string;
    invitedBy: string;
    createdAt: Date;
}
