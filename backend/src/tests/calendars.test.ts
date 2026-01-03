import request from 'supertest';
import app from '../app';
import { cleanDatabase } from './helpers/db.helper';
import { createTestUser, createTestEmployee } from './helpers/auth.helper';
import { Role } from '@prisma/client';

describe('Calendars Module', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    describe('POST /api/v1/calendars', () => {
        it('should create a new calendar', async () => {
            const { token, organizationId } = await createTestUser(Role.ORG_ADMIN);

            const res = await request(app)
                .post('/api/v1/calendars')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'General Calendar',
                    description: 'Standard work hours',
                    organizationId
                });

            expect(res.status).toBe(201);
            expect(res.body.data.name).toBe('General Calendar');
        });
    });

    describe('GET /api/v1/calendars', () => {
        it('should list calendars', async () => {
            const { token } = await createTestUser(Role.ORG_ADMIN);

            const res = await request(app)
                .get('/api/v1/calendars')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
        });
    });

    describe('GET /api/v1/calendars/:id', () => {
        it('should get calendar details', async () => {
            const { token, organizationId } = await createTestUser(Role.ORG_ADMIN);
            // Create calendar
            const createRes = await request(app)
                .post('/api/v1/calendars')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Detail Test Calendar',
                    organizationId
                });
            const calendarId = createRes.body.data.id;

            const res = await request(app)
                .get(`/api/v1/calendars/${calendarId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.data.id).toBe(calendarId);
        });
    });
});
