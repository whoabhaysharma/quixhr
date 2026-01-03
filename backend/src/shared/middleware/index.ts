/**
 * Middleware Export Hub
 * Central contact point for all middleware functions
 * 
 * Import from this file to access any middleware:
 * import { protect, restrictTo, resolveTenant, validate, globalErrorHandler } from '@/shared/middleware';
 */

// ============================================================================
// AUTH MIDDLEWARE
// ============================================================================
export { protect, restrictTo } from './auth.middleware';

// ============================================================================
// TENANT MIDDLEWARE
// ============================================================================
export { resolveTenant } from './tenant.middleware';

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================
export { default as validate } from './validate.middleware';

// ============================================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================================
export { globalErrorHandler } from './error.middleware';
