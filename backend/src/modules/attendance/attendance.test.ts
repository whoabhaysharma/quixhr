import request from 'supertest';
import app from '../../app';
import { cleanDatabase } from '../../tests/helpers/db.helper';
import {
    createCompleteTestUser,
    createTestCalendar,
    getAuthHeader,
} from '../../tests/helpers/auth.helper';
import { Role } from '@prisma/client';
import { prisma } from '../../tests/helpers/db.helper';

describe('Attendance Module', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    describe('POST /api/v1/attendance/clock-in', () => {
        it('should allow all authenticated users to clock in', async () => {
            const { token, company, employee } = await createCompleteTestUser(
                'employee@test.com',
                'Password123!',
                Role.EMPLOYEE,
                'Test Company',
                'Employee'
            );

            // Assign calendar to employee
            const calendar = await createTestCalendar(company.id, 'Test Calendar');
            await prisma.employee.update({
                where: { id: employee.id },
                data: { calendarId: calendar.id },
            });

            const response = await request(app)
                .post('/api/v1/attendance/clock-in')
                .set(getAuthHeader(token))
                .send({
                    source: 'WEB',
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('firstCheckIn');
        });

        it('should prevent double clock-in', async () => {
            const { token, company, employee } = await createCompleteTestUser(
                'employee@test.com',
                'Password123!',
                Role.EMPLOYEE,
                'Test Company',
                'Employee'
            );

            const calendar = await createTestCalendar(company.id, 'Test Calendar');
            await prisma.employee.update({
                where: { id: employee.id },
                data: { calendarId: calendar.id },
            });

            // First clock-in
            await request(app)
                .post('/api/v1/attendance/clock-in')
                .set(getAuthHeader(token))
                .send({ source: 'WEB' });

            // Second clock-in should fail
            const response = await request(app)
                .post('/api/v1/attendance/clock-in')
                .set(getAuthHeader(token))
                .send({ source: 'WEB' });

            expect([400, 429]).toContain(response.status);
            expect(response.body.success).toBe(false);
        });

        it('should fail without authentication', async () => {
            const response = await request(app)
                .post('/api/v1/attendance/clock-in')
                .send({ source: 'WEB' });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/v1/attendance/clock-out', () => {
        it('should allow authenticated users to clock out', async () => {
            const { token, company, employee } = await createCompleteTestUser(
                'employee@test.com',
                'Password123!',
                Role.EMPLOYEE,
                'Test Company',
                'Employee'
            );

            const calendar = await createTestCalendar(company.id, 'Test Calendar');
            await prisma.employee.update({
                where: { id: employee.id },
                data: { calendarId: calendar.id },
            });

            // Clock in first
            await request(app)
                .post('/api/v1/attendance/clock-in')
                .set(getAuthHeader(token))
                .send({ source: 'WEB' });

            // Then clock out
            const response = await request(app)
                .put('/api/v1/attendance/clock-out')
                .set(getAuthHeader(token))
                .send({ source: 'WEB' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('lastCheckOut');
        });

        it('should fail to clock out without clocking in', async () => {
            const { token, company, employee } = await createCompleteTestUser(
                'employee@test.com',
                'Password123!',
                Role.EMPLOYEE,
                'Test Company',
                'Employee'
            );

            const calendar = await createTestCalendar(company.id, 'Test Calendar');
            await prisma.employee.update({
                where: { id: employee.id },
                data: { calendarId: calendar.id },
            });

            const response = await request(app)
                .put('/api/v1/attendance/clock-out')
                .set(getAuthHeader(token))
                .send({ source: 'WEB' });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/attendance/today', () => {
        it('should allow authenticated users to get today status', async () => {
            const { token, company, employee } = await createCompleteTestUser(
                'employee@test.com',
                'Password123!',
                Role.EMPLOYEE,
                'Test Company',
                'Employee'
            );

            const calendar = await createTestCalendar(company.id, 'Test Calendar');
            await prisma.employee.update({
                where: { id: employee.id },
                data: { calendarId: calendar.id },
            });

            const response = await request(app)
                .get('/api/v1/attendance/today')
                .set(getAuthHeader(token));

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe('GET /api/v1/attendance/me', () => {
        it('should allow authenticated users to get their attendance', async () => {
            const { token, company, employee } = await createCompleteTestUser(
                'employee@test.com',
                'Password123!',
                Role.EMPLOYEE,
                'Test Company',
                'Employee'
            );

            const calendar = await createTestCalendar(company.id, 'Test Calendar');
            await prisma.employee.update({
                where: { id: employee.id },
                data: { calendarId: calendar.id },
            });

            const response = await request(app)
                .get('/api/v1/attendance/me')
                .set(getAuthHeader(token));

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('should support date range filtering', async () => {
            const { token, company, employee } = await createCompleteTestUser(
                'employee@test.com',
                'Password123!',
                Role.EMPLOYEE,
                'Test Company',
                'Employee'
            );

            const calendar = await createTestCalendar(company.id, 'Test Calendar');
            await prisma.employee.update({
                where: { id: employee.id },
                data: { calendarId: calendar.id },
            });

            const response = await request(app)
                .get('/api/v1/attendance/me')
                .query({
                    startDate: '2025-01-01',
                    endDate: '2025-01-31',
                })
                .set(getAuthHeader(token));

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe('Attendance Business Logic Scenarios', () => {
        it('should correctly calculate work duration (Business Logic)', async () => {
            const { token, company, employee } = await createCompleteTestUser(
                'duration@test.com',
                'Password123!',
                Role.EMPLOYEE,
                'Duration Co',
                'Helper'
            );

            // Setup Calendar
            const calendar = await createTestCalendar(company.id, 'Test Calendar');
            await prisma.employee.update({
                where: { id: employee.id },
                data: { calendarId: calendar.id },
            });

            // 1. Check In at 09:00
            const checkInTime = new Date('2025-06-01T09:00:00Z');
            const checkInRes = await request(app)
                .post('/api/v1/attendance/clock-in')
                .set(getAuthHeader(token))
                .send({
                    source: 'WEB',
                    date: checkInTime,
                });

            expect(checkInRes.status).toBe(201);

            // 2. Check Out at 17:00 (8 hours later)
            const checkOutTime = new Date('2025-06-01T17:00:00Z');
            const checkOutRes = await request(app)
                .put('/api/v1/attendance/clock-out')
                .set(getAuthHeader(token))
                .send({
                    source: 'WEB',
                    date: checkOutTime,
                });

            expect(checkOutRes.status).toBe(200);
            expect(checkOutRes.body.success).toBe(true);

            // 3. Verify Duration (8 hours * 60 = 480 minutes)
            // Note: DB stores minutes.
            expect(checkOutRes.body.data.totalMinutes).toBe(480);

            // Double check DB
            const record = await prisma.attendance.findUnique({
                where: { id: checkInRes.body.data.id }
            });
            expect(record?.totalMinutes).toBe(480);
        });

        it('should prevent double clock-out', async () => {
            const { token, company, employee } = await createCompleteTestUser(
                'doubleout@test.com',
                'Password123!',
                Role.EMPLOYEE,
                'Double Out Co',
                'Helper'
            );

            // Setup Calendar
            const calendar = await createTestCalendar(company.id, 'Test Calendar');
            await prisma.employee.update({
                where: { id: employee.id },
                data: { calendarId: calendar.id },
            });

            // Check In
            await request(app)
                .post('/api/v1/attendance/clock-in')
                .set(getAuthHeader(token))
                .send({ source: 'WEB' });

            // Check Out 1
            await request(app)
                .put('/api/v1/attendance/clock-out')
                .set(getAuthHeader(token))
                .send({ source: 'WEB' });

            // Check Out 2 (Should fail)
            const response = await request(app)
                .put('/api/v1/attendance/clock-out')
                .set(getAuthHeader(token))
                .send({ source: 'WEB' });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toMatch(/Already checked out/i);
        });
    });
});
