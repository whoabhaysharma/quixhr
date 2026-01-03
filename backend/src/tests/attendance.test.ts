import request from 'supertest';
import app from '../app';
import { cleanDatabase } from './helpers/db.helper';
import { createTestUser, createTestEmployee } from './helpers/auth.helper';
import { Role } from '@prisma/client';

describe('Attendance Module', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    describe('POST /api/v1/attendance/check-in', () => {
        it('should allow employee to check in', async () => {
            const { token, employee } = await createTestEmployee();

            const res = await request(app)
                .post('/api/v1/attendance/check-in')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    method: 'WEB',
                    gpsCoords: { latitude: 0, longitude: 0 }
                });

            expect(res.status).toBe(200);
        });
    });

    describe('GET /api/v1/attendance/me', () => {
        it('should get my attendance', async () => {
            const { token, employee } = await createTestEmployee();

            const res = await request(app)
                .get('/api/v1/attendance/me')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
        });
    });

    describe('GET /api/v1/attendance', () => {
        it('should list all attendance for Admin', async () => {
            const { token, organizationId } = await createTestUser(Role.ORG_ADMIN);

            const res = await request(app)
                .get('/api/v1/attendance')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
        });
    });
});
