import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';

// Import routes
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import organizationRoutes from './routes/organizations';
import leaveRoutes from './routes/leaves';
import subscriptionRoutes from './routes/subscriptions';
import planRoutes from './routes/plans';
import onboardingRoutes from './routes/onboarding';
import memberRoutes from './routes/members';
import inviteRoutes from './routes/invites';
import dashboardRoutes from './routes/dashboard';
import holidayCalendarRoutes from './routes/holidayCalendars';
import holidayRoutes from './routes/holidays';
import attendanceRoutes from './routes/attendance.routes';

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

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/health', healthRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/organizations', organizationRoutes);
app.use('/api/v1/leaves', leaveRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1/plans', planRoutes);
app.use('/api/v1/onboarding', onboardingRoutes);
app.use('/api/v1/members', memberRoutes);
app.use('/api/v1/invites', inviteRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/holiday-calendars', holidayCalendarRoutes);
app.use('/api/v1/holidays', holidayRoutes);
app.use('/api/v1/attendance', attendanceRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;