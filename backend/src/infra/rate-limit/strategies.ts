import { Request } from 'express';
import { AuthRequest } from '../../shared/middleware/auth.middleware';

/**
 * Key Generator Function Type
 */
export type KeyGenerator = (req: Request) => string;

/**
 * IP-based rate limiting
 * Uses client IP address as identifier
 */
export const ipStrategy: KeyGenerator = (req: Request): string => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return `ip:${ip}`;
};

/**
 * User-based rate limiting
 * Uses authenticated user ID as identifier
 * Falls back to IP if not authenticated
 */
export const userStrategy: KeyGenerator = (req: Request): string => {
    const authReq = req as AuthRequest;
    if (authReq.user?.id) {
        return `user:${authReq.user.id}`;
    }
    return ipStrategy(req);
};

/**
 * Endpoint-based rate limiting
 * Uses HTTP method and path as identifier
 */
export const endpointStrategy: KeyGenerator = (req: Request): string => {
    const method = req.method;
    const path = req.path || req.url;
    return `endpoint:${method}:${path}`;
};

/**
 * Combined user + endpoint rate limiting
 * Uses both user ID and endpoint as identifier
 */
export const userEndpointStrategy: KeyGenerator = (req: Request): string => {
    const authReq = req as AuthRequest;
    const method = req.method;
    const path = req.path || req.url;

    if (authReq.user?.id) {
        return `user:${authReq.user.id}:endpoint:${method}:${path}`;
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return `ip:${ip}:endpoint:${method}:${path}`;
};

/**
 * Company-based rate limiting
 * Uses company ID as identifier
 */
export const companyStrategy: KeyGenerator = (req: Request): string => {
    const authReq = req as AuthRequest;
    if (authReq.user?.companyId) {
        return `company:${authReq.user.companyId}`;
    }
    return ipStrategy(req);
};

/**
 * Custom key generator factory
 * Creates a custom key generator with prefix
 */
export const createCustomStrategy = (prefix: string, extractor: (req: Request) => string): KeyGenerator => {
    return (req: Request): string => {
        const value = extractor(req);
        return `${prefix}:${value}`;
    };
};
