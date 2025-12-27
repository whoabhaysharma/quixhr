import crypto from 'crypto';
import { redis } from '../../infra/redis/redis.connection';

/**
 * Email Verification Service
 * 
 * Redis-based email verification with token hashing and TTL
 */

const VERIFY_PREFIX = 'email_verify:';
const RESEND_PREFIX = 'email_verify_resend:';
const VERIFY_TTL = 30 * 60; // 30 minutes
const RESEND_TTL = 60; // 60 seconds

/**
 * Generate verification token
 */
export function generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash token for Redis storage
 */
export function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Store verification token in Redis
 */
export async function storeVerificationToken(
    token: string,
    userId: string
): Promise<void> {
    const tokenHash = hashToken(token);
    const key = `${VERIFY_PREFIX}${tokenHash}`;

    await redis.setex(key, VERIFY_TTL, userId);
}

/**
 * Verify token and get user ID
 */
export async function verifyToken(token: string): Promise<string | null> {
    const tokenHash = hashToken(token);
    const key = `${VERIFY_PREFIX}${tokenHash}`;

    const userId = await redis.get(key);

    if (userId) {
        // Delete token after use (one-time use)
        await redis.del(key);
    }

    return userId;
}

/**
 * Check if user can resend verification email
 */
export async function canResendVerification(userId: string): Promise<boolean> {
    const key = `${RESEND_PREFIX}${userId}`;
    const exists = await redis.exists(key);

    return exists === 0;
}

/**
 * Mark user as having requested resend
 */
export async function markResendAttempt(userId: string): Promise<void> {
    const key = `${RESEND_PREFIX}${userId}`;
    await redis.setex(key, RESEND_TTL, '1');
}

/**
 * Delete verification token
 */
export async function deleteVerificationToken(token: string): Promise<void> {
    const tokenHash = hashToken(token);
    const key = `${VERIFY_PREFIX}${tokenHash}`;
    await redis.del(key);
}

/**
 * Get remaining TTL for resend cooldown
 */
export async function getResendCooldown(userId: string): Promise<number> {
    const key = `${RESEND_PREFIX}${userId}`;
    const ttl = await redis.ttl(key);
    return ttl > 0 ? ttl : 0;
}
