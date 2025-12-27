import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './shared/config';
import { errorHandler } from './shared/middleware/errorHandler';
import { notFoundHandler } from './shared/middleware/notFoundHandler';

// Import module routes (business domains)
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/users.routes';
import organizationRoutes from './modules/organizations/organizations.routes';
import leaveRoutes from './modules/leaves/leaves.routes';
import subscriptionRoutes from './modules/subscriptions/subscriptions.routes';
import planRoutes from './modules/plans/plans.routes';
import memberRoutes from './modules/members/members.routes';
import inviteRoutes from './modules/invites/invites.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import holidayCalendarRoutes from './modules/holidays/holiday-calendars.routes';
import holidayRoutes from './modules/holidays/holidays.routes';
import attendanceRoutes from './modules/attendance/attendance.routes';
import webhookRoutes from './modules/webhooks/webhooks.routes';

// Import platform routes (infrastructure)
import healthRoutes from './platform/health/health.routes';

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));

// Logging
app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Platform Routes (infrastructure)
app.use('/health', healthRoutes);

// API Routes (business modules)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/organizations', organizationRoutes);
app.use('/api/v1/leaves', leaveRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1/plans', planRoutes);
app.use('/api/v1/members', memberRoutes);
app.use('/api/v1/invites', inviteRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/holiday-calendars', holidayCalendarRoutes);
app.use('/api/v1/holidays', holidayRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/webhooks', webhookRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;