import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import hpp from 'hpp';

import { globalErrorHandler } from './shared/middleware';
import { AppError } from './utils/appError';

// Route Imports
import { authRoutes } from './modules/auth';
import { webhookRoutes } from './modules/webhooks';
// import planRoutes from './modules/plans/plans.routes';
import { invitationRoutes } from './modules/invitations';
import { meRoutes } from './modules/me';
import { organizationRoutes } from './modules/organizations';
// import { employeeRoutes } from './modules/employees';
import { membersRoutes } from './modules/members';
import { calendarRoutes } from './modules/calendars';
import { leaveRoutes } from './modules/leaves';
import { allocationRoutes } from './modules/allocations';
import { attendanceRoutes } from './modules/attendance';
import { dashboardRoutes } from './modules/dashboard';
import { adminRoutes } from './modules/admin';
import { apiLimiter } from './utils/rateLImiter';

const app = express();

// ==========================================
// 1. GLOBAL MIDDLEWARES
// ==========================================

// Security Headers
app.use(helmet());

// CORS - Restricted to your frontend in production
// CORS - Restricted to your frontend in production
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.FRONTEND_URL
    ].filter(Boolean) as string[];

    // Check if origin is in allowed list or if it's a localhost URL (for loose dev matching)
    if (allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
      callback(null, true);
    } else {
      console.error('CORS Blocked:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Performance
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body Parsing & Security
app.use(express.json({ limit: '10kb' })); // Protection against large payloads
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(hpp()); // Prevent Parameter Pollution

// ==========================================
// 2. ROUTES
// ==========================================

// Health Check (Always before rate limiting to avoid false negatives)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'up', timestamp: new Date().toISOString() });
});

// Apply Global Rate Limiting
app.use('/api', apiLimiter);

// Versioned Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/webhooks', webhookRoutes);
app.use('/api/v1/invitations', invitationRoutes);
app.use('/api/v1/me', meRoutes);
app.use('/api/v1/org', organizationRoutes);
app.use('/api/v1/members', membersRoutes);
app.use('/api/v1/calendars', calendarRoutes);
app.use('/api/v1/leaves', leaveRoutes);
app.use('/api/v1/allocations', allocationRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/admin', adminRoutes);

// ==========================================
// 3. ERROR HANDLING
// ==========================================

// Handle Undefined Routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Middleware (The one we built earlier)
app.use(globalErrorHandler);

export default app;