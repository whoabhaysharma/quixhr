import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import hpp from 'hpp';

import { globalErrorHandler } from './shared/middleware/errorMiddleware';
import { AppError } from './utils/appError';

// Route Imports
import authRoutes from './modules/auth/auth.routes';
import { apiLimiter } from './utils/rateLImiter';

const app = express();

// ==========================================
// 1. GLOBAL MIDDLEWARES
// ==========================================

// Security Headers
app.use(helmet());

// CORS - Restricted to your frontend in production
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
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