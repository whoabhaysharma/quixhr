import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { apiRateLimit } from './shared/middleware';

// Import routes
import authRoutes from './modules/auth/auth.routes';
import companyRoutes from './modules/company/company.routes';
import employeeRoutes from './modules/employee/employee.routes';
import calendarRoutes from './modules/calendar/calendar.routes';
import attendanceRoutes from './modules/attendance/attendance.routes';
import notificationRoutes from './modules/notification/notification.controller';
import dashboardRoutes from './modules/dashboard/dashboard.controller';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Logging
app.use(morgan('dev'));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global rate limiting (1000 requests per hour)
app.use('/api/v1', apiRateLimit);

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/companies', companyRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/calendars', calendarRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
