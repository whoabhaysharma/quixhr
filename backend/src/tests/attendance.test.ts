import request from 'supertest';
import app from '../app';
import { cleanDatabase } from './helpers/db.helper';
import { createTestUser, createTestEmployee } from './helpers/auth.helper';
import { Role } from '@prisma/client';
import { prisma } from './setup';
import jwt from 'jsonwebtoken';

describe('Attendance Module', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    const setupEmployee = async () => {
        const { user, token, employee } = await createTestEmployee(undefined, Role.EMPLOYEE);
        return { user, token, companyId: employee.companyId, employee };
    };

    describe('Clock In/Out Lifecycle', () => {
        it('should allow employee to clock in', async () => {
            const { token } = await setupEmployee();
            console.log('Token Payload:', jwt.decode(token));

            const res = await request(app)
                .post('/api/v1/attendance/check-in')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    method: 'WEB',
                    gpsCoords: { latitude: 12.9716, longitude: 77.5946 }
                });

            if (res.body.status !== 'success') {
                console.error('Clock In Failed:', JSON.stringify(res.body, null, 2));
            }

            expect(res.body).toEqual(expect.objectContaining({
                status: 'success',
                data: expect.objectContaining({
                    status: 'PRESENT'
                })
            }));
            expect(res.body.data.checkIn).toBeDefined();
        });

        it('should prevent double clock in', async () => {
            const { token } = await setupEmployee();

            // First Clock In
            await request(app)
                .post('/api/v1/attendance/check-in')
                .set('Authorization', `Bearer ${token}`)
                .send({ method: 'WEB' });

            // Second Clock In
            const res = await request(app)
                .post('/api/v1/attendance/check-in')
                .set('Authorization', `Bearer ${token}`)
                .send({ method: 'WEB' });

            expect(res.body.status).toBe('error');
            // Check for specific error message if possible
        });

        it('should allow employee to clock out', async () => {
            const { token } = await setupEmployee();

            // Clock In First
            await request(app)
                .post('/api/v1/attendance/check-in')
                .set('Authorization', `Bearer ${token}`)
                .send({ method: 'WEB' });

            // Clock Out
            const res = await request(app)
                .post('/api/v1/attendance/check-out')
                .set('Authorization', `Bearer ${token}`)
                .send({ method: 'WEB' });

            if (res.body.status !== 'success') {
                console.log('Clock Out Failed:', JSON.stringify(res.body, null, 2));
            }

            expect(res.body.status).toBe('success');
            expect(res.body.data.checkOut).toBeDefined();
            expect(res.body.data.workMinutes).toBeDefined();
        });

        it('should get daily logs', async () => {
            const { token, employee } = await setupEmployee();

            // Clock In
            await request(app)
                .post('/api/v1/attendance/check-in')
                .set('Authorization', `Bearer ${token}`)
                .send({ method: 'WEB' });

            const res = await request(app)
                .get('/api/v1/attendance') // getMyAttendance
                .set('Authorization', `Bearer ${token}`);

            if (res.body.status !== 'success') {
                console.log('Get Logs Failed:', JSON.stringify(res.body, null, 2));
            }

            expect(res.body.status).toBe('success');
            expect(res.body.data.employeeId).toBe(employee!.id);
            expect(res.body.data.logs.length).toBeGreaterThanOrEqual(1);
            expect(res.body.data.logs[0].type).toBe('IN');
        });

        it('should get logs via generic endpoint', async () => {
            const { token } = await setupEmployee();
            // Clock In
            await request(app)
                .post('/api/v1/attendance/check-in')
                .set('Authorization', `Bearer ${token}`)
                .send({ method: 'WEB' });

            const today = new Date().toISOString();

            const res = await request(app)
                .get(`/api/v1/attendance/logs?date=${today}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.body.status).toBe('success');
            expect(res.body.data.logs.length).toBeGreaterThanOrEqual(1);
        });
    });
});
