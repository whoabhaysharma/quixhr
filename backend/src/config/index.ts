import * as dotenv from 'dotenv';

// Load environment variables FIRST, before accessing process.env
dotenv.config();

/**
 * Application Configuration
 * 
 * Centralized configuration management for environment variables
 */

export const config = {
    // Server
    port: parseInt(process.env.PORT || '3000'),
    nodeEnv: process.env.NODE_ENV || 'development',

    // JWT
    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },

    // Database
    database: {
        url: process.env.DATABASE_URL || '',
    },

    // Redis
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
    },

    // AWS
    aws: {
        region: process.env.AWS_REGION || 'us-east-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },

    // Email
    email: {
        from: process.env.FROM_EMAIL || 'no-reply@quixhr.com',
        smtp: {
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        }
    },

    // Frontend
    frontend: {
        url: process.env.FRONTEND_URL || 'http://localhost:3001',
    },

    // Rate Limiting
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes default
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'), // 1000 requests default
        skipSuccessfulRequests: process.env.RATE_LIMIT_SKIP_SUCCESS === 'true',
        skipFailedRequests: process.env.RATE_LIMIT_SKIP_FAILED === 'true',
    },

    // Notifications
    notification: {
        retentionDays: parseInt(process.env.NOTIFICATION_RETENTION_DAYS || '2'),
    },

    // Super Admin
    superAdmin: {
        email: process.env.SUPER_ADMIN_EMAIL || 'whoabhaysharma@gmail.com',
        password: process.env.SUPER_ADMIN_PASSWORD || 'password123',
    },

    // Audit
    audit: {
        retentionDays: parseInt(process.env.AUDIT_RETENTION_DAYS || '7'),
    },
} as const;

/**
 * Validate required environment variables
 */
export const validateConfig = (): void => {
    const required = [
        'DATABASE_URL',
        'JWT_SECRET',
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missing.join(', ')}`
        );
    }
};
